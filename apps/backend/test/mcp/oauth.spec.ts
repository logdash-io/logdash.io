import request from 'supertest';
import { createHash, randomBytes } from 'crypto';
import { createTestApp } from '../utils/bootstrap';
import { getEnvConfig } from '../../src/shared/configs/env-configs';

describe('MCP OAuth', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  const redirectUri = 'http://127.0.0.1:5555/callback';
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });
  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });
  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const server = (): ReturnType<typeof request> => request(bootstrap.app.getHttpServer());

  async function registerClient(): Promise<string> {
    const response = await server()
      .post('/oauth/register')
      .send({
        client_name: 'Claude Code',
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
      });

    expect(response.status).toBe(201);

    return (response.body as { client_id: string }).client_id;
  }

  function authorizeBody(clientId: string): Record<string, string> {
    return {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      scope: 'webAnalytics:read',
      state: 'state-1',
    };
  }

  async function startConsent(clientId: string, token: string): Promise<string> {
    const response = await server()
      .post('/oauth/authorize/details')
      .set('Authorization', `Bearer ${token}`)
      .send(authorizeBody(clientId));

    expect(response.status).toBe(200);

    return (response.body as { consentId: string }).consentId;
  }

  it('publishes the protected resource and authorization server metadata', async () => {
    const apiUrl = getEnvConfig().api.url;

    const resource = await server().get('/.well-known/oauth-protected-resource/mcp');
    const resourceBody = resource.body as {
      resource: string;
      authorization_servers: string[];
    };
    expect(resource.status).toBe(200);
    expect(resourceBody.resource).toBe(`${apiUrl}/mcp`);
    expect(resourceBody.authorization_servers).toEqual([apiUrl]);

    const authorizationServer = await server().get('/.well-known/oauth-authorization-server');
    const authorizationServerBody = authorizationServer.body as {
      token_endpoint: string;
      code_challenge_methods_supported: string[];
    };
    expect(authorizationServer.status).toBe(200);
    expect(authorizationServerBody.token_endpoint).toBe(`${apiUrl}/oauth/token`);
    expect(authorizationServerBody.code_challenge_methods_supported).toEqual(['S256']);
  });

  it('advertises OAuth on the MCP 401', async () => {
    const response = await server()
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize' });

    expect(response.status).toBe(401);
    expect(String(response.headers['www-authenticate'])).toContain(
      '/.well-known/oauth-protected-resource/mcp',
    );
  });

  it('exchanges an approved authorization code for an MCP token', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clientId = await registerClient();
    const consentId = await startConsent(clientId, setup.token);

    const approved = await server()
      .post('/oauth/authorize/approve')
      .set('Authorization', `Bearer ${setup.token}`)
      .send({ consentId });
    expect(approved.status).toBe(200);

    const redirectUrl = new URL((approved.body as { redirectUrl: string }).redirectUrl);
    expect(redirectUrl.searchParams.get('state')).toBe('state-1');
    const code = redirectUrl.searchParams.get('code');
    expect(code).toBeTruthy();

    const token = await server().post('/oauth/token').type('form').send({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    const tokenBody = token.body as { token_type: string; access_token: string };
    expect(token.status).toBe(200);
    expect(tokenBody.token_type).toBe('Bearer');
    expect(tokenBody.access_token).toMatch(/^ldp_/);

    const initialized = await server()
      .post('/mcp')
      .set('Authorization', `Bearer ${tokenBody.access_token}`)
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test' } },
      });
    expect(initialized.status).toBe(200);

    const reuse = await server().post('/oauth/token').type('form').send({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    expect(reuse.status).toBe(400);
    expect((reuse.body as { error: string }).error).toBe('invalid_grant');
  });

  it('rejects a code exchange with the wrong verifier', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clientId = await registerClient();
    const consentId = await startConsent(clientId, setup.token);
    const approved = await server()
      .post('/oauth/authorize/approve')
      .set('Authorization', `Bearer ${setup.token}`)
      .send({ consentId });
    const code = new URL((approved.body as { redirectUrl: string }).redirectUrl).searchParams.get(
      'code',
    );

    const token = await server()
      .post('/oauth/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: randomBytes(32).toString('base64url'),
      });

    expect(token.status).toBe(400);
    expect((token.body as { error: string }).error).toBe('invalid_grant');
  });

  it('returns access_denied when the user declines', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clientId = await registerClient();
    const consentId = await startConsent(clientId, setup.token);

    const denied = await server()
      .post('/oauth/authorize/deny')
      .set('Authorization', `Bearer ${setup.token}`)
      .send({ consentId });

    expect(denied.status).toBe(200);
    const redirectUrl = new URL((denied.body as { redirectUrl: string }).redirectUrl);
    expect(redirectUrl.searchParams.get('error')).toBe('access_denied');
    expect(redirectUrl.searchParams.get('state')).toBe('state-1');
  });

  it('rejects a redirect URI that was never registered', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    const clientId = await registerClient();

    const response = await server()
      .post('/oauth/authorize/details')
      .set('Authorization', `Bearer ${setup.token}`)
      .send({ ...authorizeBody(clientId), redirect_uri: 'https://evil.example/callback' });

    expect(response.status).toBe(400);
  });
});
