import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { PersonalApiKeyWriteService } from '../../personal-api-key/write/personal-api-key-write.service';
import { ACTION_RANK, Action } from '../../personal-api-key/core/enums/action.enum';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { ScopeEntry } from '../../personal-api-key/core/types/scope-entry.type';
import { McpOAuthStoreService } from './mcp-oauth-store.service';
import {
  MCP_OAUTH_AUTHORIZE_PATH,
  MCP_OAUTH_CONSENT_TTL_SECONDS,
  MCP_OAUTH_KEY_TTL_DAYS,
  MCP_OAUTH_SCOPES,
  McpOAuthClient,
  McpOAuthCode,
  McpOAuthPendingConsent,
} from './mcp-oauth.types';

const CLIENT_NAME_MAX_LENGTH = 200;
const REDIRECT_URI_MAX_LENGTH = 2048;
const REDIRECT_URI_MAX_COUNT = 10;
const STATE_MAX_LENGTH = 2048;
const DEFAULT_SCOPE = 'webAnalytics:read';
const PKCE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const PKCE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;

export interface McpOAuthConsentDetails {
  consentId: string;
  clientName: string;
  redirectHost: string;
  scopes: string[];
  expiresAt: string;
}

export interface McpOAuthRedirect {
  redirectUrl: string;
}

export interface McpOAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

function randomToken(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function requiredString(body: Record<string, unknown>, name: string, maxLength: number): string {
  const value = body[name];

  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new BadRequestException(`Invalid ${name}`);
  }

  return value;
}

function optionalString(
  body: Record<string, unknown>,
  name: string,
  maxLength: number,
): string | null {
  const value = body[name];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.length > maxLength) {
    throw new BadRequestException(`Invalid ${name}`);
  }

  return value;
}

@Injectable()
export class McpOAuthService {
  constructor(
    private readonly store: McpOAuthStoreService,
    private readonly personalApiKeyWriteService: PersonalApiKeyWriteService,
  ) {}

  public protectedResourceMetadata(): Record<string, unknown> {
    const apiUrl = getEnvConfig().api.url;

    return {
      resource: `${apiUrl}/mcp`,
      authorization_servers: [apiUrl],
      scopes_supported: [...MCP_OAUTH_SCOPES],
      bearer_methods_supported: ['header'],
      resource_name: 'Logdash web analytics',
    };
  }

  public authorizationServerMetadata(): Record<string, unknown> {
    const apiUrl = getEnvConfig().api.url;

    return {
      issuer: apiUrl,
      authorization_endpoint: `${getEnvConfig().app.url}${MCP_OAUTH_AUTHORIZE_PATH}`,
      token_endpoint: `${apiUrl}/oauth/token`,
      registration_endpoint: `${apiUrl}/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [...MCP_OAUTH_SCOPES],
    };
  }

  public async registerClient(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const redirectUris = this.parseRedirectUris(body.redirect_uris);
    const clientName = optionalString(body, 'client_name', CLIENT_NAME_MAX_LENGTH) ?? 'MCP client';
    const tokenEndpointAuthMethod =
      optionalString(body, 'token_endpoint_auth_method', 50) ?? 'none';

    if (tokenEndpointAuthMethod !== 'none') {
      throw this.oauthError(
        'invalid_client_metadata',
        'Only public clients with token_endpoint_auth_method none can register',
      );
    }

    const client: McpOAuthClient = {
      clientId: randomToken(16),
      clientName,
      redirectUris,
      createdAt: Date.now(),
    };

    await this.store.saveClient(client);

    return {
      client_id: client.clientId,
      client_id_issued_at: Math.floor(client.createdAt / 1000),
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
  }

  public async startConsent(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<McpOAuthConsentDetails> {
    const clientId = requiredString(body, 'client_id', 200);
    const client = await this.store.getClient(clientId);

    if (!client) {
      throw new BadRequestException('Unknown client');
    }

    const redirectUri = requiredString(body, 'redirect_uri', REDIRECT_URI_MAX_LENGTH);

    if (!client.redirectUris.includes(redirectUri)) {
      throw new BadRequestException('The redirect URI does not belong to this client');
    }

    const responseType = requiredString(body, 'response_type', 20);

    if (responseType !== 'code') {
      throw new BadRequestException('Only the code response type is supported');
    }

    const codeChallenge = requiredString(body, 'code_challenge', 200);

    if (!PKCE_CHALLENGE_PATTERN.test(codeChallenge)) {
      throw new BadRequestException('Invalid code_challenge');
    }

    const codeChallengeMethod = requiredString(body, 'code_challenge_method', 20);

    if (codeChallengeMethod !== 'S256') {
      throw new BadRequestException('Only the S256 code challenge method is supported');
    }

    const state = optionalString(body, 'state', STATE_MAX_LENGTH);
    const { scopes, scope } = this.parseScopes(body.scope);
    const consentId = randomToken(32);
    const pending: McpOAuthPendingConsent = {
      userId,
      clientId: client.clientId,
      clientName: client.clientName,
      redirectUri,
      state,
      codeChallenge,
      scopes,
      scope,
      createdAt: Date.now(),
    };

    await this.store.saveConsent(consentId, pending);

    return {
      consentId,
      clientName: client.clientName,
      redirectHost: new URL(redirectUri).host,
      scopes: scope.split(' '),
      expiresAt: new Date(pending.createdAt + MCP_OAUTH_CONSENT_TTL_SECONDS * 1000).toISOString(),
    };
  }

  public async approveConsent(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<McpOAuthRedirect> {
    const consentId = requiredString(body, 'consentId', 200);
    const pending = await this.resolveConsent(userId, consentId);

    await this.store.deleteConsent(consentId);

    const code = randomToken(32);
    const record: McpOAuthCode = {
      userId: pending.userId,
      clientId: pending.clientId,
      clientName: pending.clientName,
      redirectUri: pending.redirectUri,
      codeChallenge: pending.codeChallenge,
      scopes: pending.scopes,
      scope: pending.scope,
      createdAt: Date.now(),
    };

    await this.store.saveCode(sha256(code), record);

    return { redirectUrl: this.buildRedirectUrl(pending.redirectUri, pending.state, { code }) };
  }

  public async denyConsent(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<McpOAuthRedirect> {
    const consentId = requiredString(body, 'consentId', 200);
    const pending = await this.resolveConsent(userId, consentId);

    await this.store.deleteConsent(consentId);

    return {
      redirectUrl: this.buildRedirectUrl(pending.redirectUri, pending.state, {
        error: 'access_denied',
      }),
    };
  }

  public async exchangeToken(body: Record<string, unknown>): Promise<McpOAuthTokenResponse> {
    const grantType = requiredString(body, 'grant_type', 50);

    if (grantType !== 'authorization_code') {
      throw this.oauthError('unsupported_grant_type', 'Only authorization_code is supported');
    }

    const clientId = requiredString(body, 'client_id', 200);
    const code = requiredString(body, 'code', 500);
    const redirectUri = requiredString(body, 'redirect_uri', REDIRECT_URI_MAX_LENGTH);
    const codeVerifier = requiredString(body, 'code_verifier', 200);

    if (!PKCE_VERIFIER_PATTERN.test(codeVerifier)) {
      throw this.oauthError('invalid_grant', 'Invalid code_verifier');
    }

    const record = await this.store.takeCode(sha256(code));

    if (!record) {
      throw this.oauthError('invalid_grant', 'Unknown or used authorization code');
    }

    if (record.clientId !== clientId || record.redirectUri !== redirectUri) {
      throw this.oauthError('invalid_grant', 'The code does not belong to this client');
    }

    if (this.pkceChallenge(codeVerifier) !== record.codeChallenge) {
      throw this.oauthError('invalid_grant', 'The code_verifier does not match');
    }

    const expiresAt = new Date(Date.now() + MCP_OAUTH_KEY_TTL_DAYS * 24 * 60 * 60 * 1000);
    const { value } = await this.personalApiKeyWriteService.create({
      userId: record.userId,
      label: `MCP (${record.clientName})`,
      scopes: record.scopes,
      access: { kind: 'all' },
      expiresAt,
    });

    return {
      access_token: value,
      token_type: 'Bearer',
      expires_in: MCP_OAUTH_KEY_TTL_DAYS * 24 * 60 * 60,
      scope: record.scope,
    };
  }

  private async resolveConsent(userId: string, consentId: string): Promise<McpOAuthPendingConsent> {
    const pending = await this.store.getConsent(consentId);

    if (!pending) {
      throw new GoneException('This authorization request expired');
    }

    if (pending.userId !== userId) {
      throw new ForbiddenException('This authorization request belongs to another user');
    }

    return pending;
  }

  private parseScopes(value: unknown): { scopes: ScopeEntry[]; scope: string } {
    const requested =
      typeof value === 'string' && value.trim() !== ''
        ? value.split(' ').filter((entry) => entry.length > 0)
        : [DEFAULT_SCOPE];
    let action = Action.None;

    for (const entry of requested) {
      const [resource, requestedAction] = entry.split(':');

      if (resource !== String(Resource.WebAnalytics)) {
        throw this.oauthError('invalid_scope', `Unsupported scope ${entry}`);
      }

      let parsedAction: Action;

      if (requestedAction === String(Action.Read)) {
        parsedAction = Action.Read;
      } else if (requestedAction === String(Action.Write)) {
        parsedAction = Action.Write;
      } else {
        throw this.oauthError('invalid_scope', `Unsupported scope ${entry}`);
      }

      if (ACTION_RANK[parsedAction] > ACTION_RANK[action]) {
        action = parsedAction;
      }
    }

    const scopes: ScopeEntry[] = [{ resource: Resource.WebAnalytics, action }];

    return { scopes, scope: `${Resource.WebAnalytics}:${action}` };
  }

  private parseRedirectUris(value: unknown): string[] {
    if (!Array.isArray(value) || value.length === 0 || value.length > REDIRECT_URI_MAX_COUNT) {
      throw this.oauthError('invalid_redirect_uri', 'redirect_uris must hold 1 to 10 entries');
    }

    return value.map((entry) => {
      if (typeof entry !== 'string' || entry.length > REDIRECT_URI_MAX_LENGTH) {
        throw this.oauthError('invalid_redirect_uri', 'Invalid redirect URI');
      }

      let url: URL;

      try {
        url = new URL(entry);
      } catch {
        throw this.oauthError('invalid_redirect_uri', 'Invalid redirect URI');
      }

      const isLoopback =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';

      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) {
        throw this.oauthError(
          'invalid_redirect_uri',
          'Redirect URIs must use https or http on a loopback address',
        );
      }

      if (url.hash !== '') {
        throw this.oauthError('invalid_redirect_uri', 'Redirect URIs cannot hold a fragment');
      }

      return entry;
    });
  }

  private buildRedirectUrl(
    redirectUri: string,
    state: string | null,
    params: Record<string, string>,
  ): string {
    const url = new URL(redirectUri);

    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }

    if (state !== null) {
      url.searchParams.set('state', state);
    }

    return url.toString();
  }

  private pkceChallenge(codeVerifier: string): string {
    return createHash('sha256').update(codeVerifier).digest('base64url');
  }

  private oauthError(error: string, errorDescription: string): HttpException {
    return new HttpException({ error, error_description: errorDescription }, 400);
  }
}
