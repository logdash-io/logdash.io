import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { RedisService } from '../../src/shared/redis/redis.service';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { Types } from 'mongoose';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';

const USER_CODE_REGEX = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

describe('CLI authorization (device-authorization flow)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let redisService: RedisService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    redisService = bootstrap.module.get(RedisService);
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const server = () => bootstrap.app.getHttpServer();

  const start = async (userAgent = 'ld/1.2.3 (test)') => {
    const response = await request(server())
      .post('/auth/cli/start')
      .set('User-Agent', userAgent)
      .send();
    expect(response.status).toBe(201);
    return response.body as {
      deviceCode: string;
      userCode: string;
      verificationUri: string;
      expiresIn: number;
      interval: number;
    };
  };

  const poll = async (deviceCode: string) =>
    request(server()).post('/auth/cli/poll').send({ deviceCode });

  const lookup = async (token: string, userCode: string) =>
    request(server())
      .post('/auth/cli/lookup')
      .set('Authorization', `Bearer ${token}`)
      .send({ userCode });

  // `access` is mandatory now: the consent screen must make reach an explicit choice.
  const approve = async (
    token: string,
    body: Record<string, unknown>,
  ) =>
    request(server())
      .post('/auth/cli/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ access: { kind: 'all' }, ...body });

  // expire ALL pending records by clearing the redis store (TTL elapsed equivalent)
  const expireAll = async () => {
    await redisService.delPattern('cli-auth:*');
  };

  describe('start', () => {
    it('returns a high-entropy deviceCode and a distinct glanceable userCode', async () => {
      const result = await start();

      expect(typeof result.deviceCode).toBe('string');
      expect(typeof result.userCode).toBe('string');

      // deviceCode is long / high-entropy (base62 of 24 bytes ~ 30+ chars)
      expect(result.deviceCode.length).toBeGreaterThanOrEqual(28);
      // userCode matches XXXX-XXXX over the unambiguous alphabet
      expect(result.userCode).toMatch(USER_CODE_REGEX);
      // no ambiguous characters
      expect(result.userCode).not.toMatch(/[O0I1L]/);

      // distinct
      expect(result.deviceCode).not.toBe(result.userCode);
      expect(result.deviceCode.replace(/-/g, '')).not.toContain(result.userCode.replace(/-/g, ''));

      expect(result.expiresIn).toBe(600);
      expect(result.interval).toBe(5);
      expect(result.verificationUri).toContain('/app/authorize-cli');
      // ADR-0003 invariant #3: the userCode is NEVER carried in a URL. A magic link
      // with the code pre-filled turns the consent check into a rubber stamp.
      expect(result).not.toHaveProperty('verificationUriComplete');
      expect(result.verificationUri).not.toContain(result.userCode);
      expect(JSON.stringify(result.verificationUri)).not.toContain('user_code');
    });

    it('returns distinct codes across calls', async () => {
      const a = await start();
      const b = await start();

      expect(a.deviceCode).not.toBe(b.deviceCode);
      expect(a.userCode).not.toBe(b.userCode);
    });
  });

  describe('poll before approve', () => {
    it('returns pending', async () => {
      const { deviceCode } = await start();

      const response = await poll(deviceCode);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('pending');
      expect(response.body).not.toHaveProperty('value');
    });
  });

  describe('approve auth gating', () => {
    it('rejects approve WITHOUT a session token (401)', async () => {
      const { userCode } = await start();

      const response = await request(server())
        .post('/auth/cli/approve')
        .send({ userCode });

      expect(response.status).toBe(401);
    });

    it('rejects approve presented with a Personal API Key (403 — key management stays session-only)', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      // mint an all-access personal key
      const createResponse = await request(server())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          label: 'k',
          scopes: [{ resource: Resource.Account, action: Action.Write }],
          access: { kind: 'all' },
        });
      const personalKey = createResponse.body.value;

      const response = await request(server())
        .post('/auth/cli/approve')
        .set('Authorization', `Bearer ${personalKey}`)
        .send({ userCode });

      expect(response.status).toBe(403);
    });
  });

  describe('happy path: approve then one-time delivery', () => {
    it('approves under session, mints a key, delivers the value exactly once', async () => {
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { deviceCode, userCode } = await start();

      // approve under the session JWT
      const approveResponse = await approve(token, { userCode });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.status).toBe('approved');
      expect(approveResponse.body.prefix).toMatch(/^ldp_/);
      // the browser NEVER receives the full value
      expect(approveResponse.body).not.toHaveProperty('value');

      // a personal key now exists for that user
      const listResponse = await request(server())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].prefix).toBe(approveResponse.body.prefix);

      // poll(deviceCode) returns the value once
      const pollResponse = await poll(deviceCode);
      expect(pollResponse.status).toBe(200);
      expect(pollResponse.body.status).toBe('approved');
      expect(typeof pollResponse.body.value).toBe('string');
      expect(pollResponse.body.value.startsWith('ldp_')).toBe(true);

      const deliveredValue = pollResponse.body.value;

      // the delivered value actually works against whoami, as that user
      const whoamiResponse = await request(server())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${deliveredValue}`);
      expect(whoamiResponse.status).toBe(200);
      expect(whoamiResponse.body.userId).toBe(user.id);

      // SECOND poll after delivery -> expired/not-found (value never twice)
      const secondPoll = await poll(deviceCode);
      expect(secondPoll.status).toBe(200);
      expect(secondPoll.body.status).toBe('expired');
      expect(secondPoll.body).not.toHaveProperty('value');
    });
  });

  describe('anti-exfil: userCode can never retrieve a value', () => {
    it('polling with the userCode in place of the deviceCode NEVER returns a value', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      await approve(token, { userCode });

      // attacker holds only the userCode (glanceable). Try it as a deviceCode.
      const attempts = [userCode, userCode.replace('-', ''), userCode.toLowerCase()];

      for (const attempt of attempts) {
        const response = await poll(attempt);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('expired');
        expect(response.body).not.toHaveProperty('value');
      }

      // and the legitimate deviceCode holder can still retrieve it afterwards
      // (proves the userCode attempts did not consume the one-time delivery)
      // re-run a fresh flow to assert delivery still works end-to-end:
    });

    it('the real deviceCode still delivers after failed userCode poll attempts', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { deviceCode, userCode } = await start();

      await approve(token, { userCode });

      // exfil attempts with the userCode
      await poll(userCode);
      await poll(userCode.replace('-', ''));

      // the genuine deviceCode still works once
      const response = await poll(deviceCode);
      expect(response.body.status).toBe('approved');
      expect(typeof response.body.value).toBe('string');
    });
  });

  describe('expiry', () => {
    it('poll on an expired pending record -> expired', async () => {
      const { deviceCode } = await start();

      await expireAll();

      const response = await poll(deviceCode);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('expired');
    });

    it('approve on an expired userCode -> 404', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      await expireAll();

      const response = await approve(token, { userCode });

      expect(response.status).toBe(404);
    });

    it('approve on a completely unknown userCode -> 404', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await approve(token, { userCode: 'ABCD-EFGH' });

      expect(response.status).toBe(404);
    });
  });

  describe('deny path', () => {
    it('deny under session -> poll returns denied, value never delivered', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { deviceCode, userCode } = await start();

      const denyResponse = await request(server())
        .post('/auth/cli/deny')
        .set('Authorization', `Bearer ${token}`)
        .send({ userCode });

      expect(denyResponse.status).toBe(200);
      expect(denyResponse.body.status).toBe('denied');

      const pollResponse = await poll(deviceCode);
      expect(pollResponse.status).toBe(200);
      expect(pollResponse.body.status).toBe('denied');
      expect(pollResponse.body).not.toHaveProperty('value');

      // no key was minted
      const listResponse = await request(server())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`);
      expect(listResponse.body).toHaveLength(0);
    });
  });

  describe('minted key scopes/access', () => {
    it('uses CLI_DEFAULT scopes when none supplied, with the caller-chosen access', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { deviceCode, userCode } = await start();

      await approve(token, { userCode, access: { kind: 'all' } });

      const value = (await poll(deviceCode)).body.value;

      const whoami = await request(server())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${value}`);

      expect(whoami.status).toBe(200);
      expect(whoami.body.access).toEqual({ kind: 'all' });

      const resources = (whoami.body.scopes as Array<{ resource: string; action: string }>).map(
        (s) => s.resource,
      );
      // CLI_DEFAULT: logs/metrics/monitors/projects/clusters at read
      expect(resources).toEqual(
        expect.arrayContaining([
          Resource.Logs,
          Resource.Metrics,
          Resource.Monitors,
          Resource.Projects,
          Resource.Clusters,
        ]),
      );
      for (const scope of whoami.body.scopes) {
        expect(scope.action).toBe(Action.Read);
      }
      // CLI default is read-only: account is NOT present
      expect(resources).not.toContain(Resource.Account);
    });

    it('uses custom scopes/access when supplied, and those are enforced', async () => {
      // owner with two clusters/projects (P1 owner, P2 second), genuine membership
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const second = await bootstrap.utils.generalUtils.setupAnonymous();

      // make owner a genuine member of second's cluster
      const cluster = await bootstrap.models.clusterModel.findById(second.cluster.id).lean();
      const roles = { ...(cluster!.roles ?? {}), [owner.user.id]: ClusterRole.Creator };
      await bootstrap.models.clusterModel.updateOne(
        { _id: new Types.ObjectId(second.cluster.id) },
        { roles },
      );
      await redisService.flushAll();

      const { deviceCode, userCode } = await start();

      // custom read-only-on-P1 key
      await approve(owner.token, {
        userCode,
        scopes: [{ resource: Resource.Projects, action: Action.Read }],
        access: { kind: 'projects', ids: [owner.project.id] },
      });

      const value = (await poll(deviceCode)).body.value;

      // whoami reflects the custom scopes/access
      const whoami = await request(server())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${value}`);
      expect(whoami.body.access).toEqual({ kind: 'projects', ids: [owner.project.id] });
      expect(whoami.body.scopes).toEqual([{ resource: Resource.Projects, action: Action.Read }]);

      // enforcement: can read P1, cannot read P2 despite real membership
      const p1 = await request(server())
        .get(`/projects/${owner.project.id}`)
        .set('Authorization', `Bearer ${value}`);
      expect(p1.status).toBe(200);

      const p2 = await request(server())
        .get(`/projects/${second.project.id}`)
        .set('Authorization', `Bearer ${value}`);
      expect(p2.status).toBe(403);
    });
  });

  describe('poll interval (slow_down)', () => {
    it('returns slow_down when polled faster than the interval', async () => {
      const { deviceCode } = await start();

      const first = await poll(deviceCode);
      expect(first.body.status).toBe('pending');

      // immediate second poll -> throttled
      const second = await poll(deviceCode);
      expect(second.body.status).toBe('slow_down');
    });
  });

  describe('anti-phishing: the code is typed, never carried in a link', () => {
    it('binds the request to the initiating client and surfaces it on lookup', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start('ld/9.9.9 (some-box)');

      const response = await lookup(token, userCode);

      expect(response.status).toBe(200);
      expect(response.body.userCode).toBe(userCode);
      expect(response.body.clientUserAgent).toBe('ld/9.9.9 (some-box)');
      expect(typeof response.body.clientIp).toBe('string');
      expect(response.body.clientIp.length).toBeGreaterThan(0);
      expect(typeof response.body.requestedAt).toBe('string');
      // the lookup NEVER hands back anything the CLI polls with
      expect(response.body).not.toHaveProperty('deviceCode');
      expect(response.body).not.toHaveProperty('value');
    });

    it('lookup on an unknown code -> 404', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await lookup(token, 'ABCD-EFGH');

      expect(response.status).toBe(404);
    });

    it('rejects lookup WITHOUT a session token (401)', async () => {
      const { userCode } = await start();

      const response = await request(server())
        .post('/auth/cli/lookup')
        .send({ userCode });

      expect(response.status).toBe(401);
    });
  });

  describe('brute-force budget on userCode lookups (ADR-0003 invariant #2)', () => {
    it('stops answering after the per-user attempt budget is spent', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // 20 misses are answered normally...
      for (let attempt = 0; attempt < 20; attempt++) {
        const response = await lookup(token, 'ABCD-EFGH');
        expect(response.status).toBe(404);
      }

      // ...the 21st is refused outright, so the ~40-bit code cannot be walked
      const exhausted = await lookup(token, 'ABCD-EFGH');
      expect(exhausted.status).toBe(429);

      // and the budget covers approve too, not just lookup
      const { userCode } = await start();
      const approveResponse = await approve(token, { userCode });
      expect(approveResponse.status).toBe(429);
    });

    it('the budget is per user — another user is unaffected', async () => {
      const noisy = await bootstrap.utils.generalUtils.setupAnonymous();
      const quiet = await bootstrap.utils.generalUtils.setupAnonymous();

      for (let attempt = 0; attempt < 21; attempt++) {
        await lookup(noisy.token, 'ABCD-EFGH');
      }
      expect((await lookup(noisy.token, 'ABCD-EFGH')).status).toBe(429);

      const { userCode } = await start();
      expect((await lookup(quiet.token, userCode)).status).toBe(200);
    });
  });

  describe('approve payload validation', () => {
    it('rejects an approve with no access choice (no implicit all-access)', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      const response = await request(server())
        .post('/auth/cli/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({ userCode });

      expect(response.status).toBe(400);
    });

    it.each([
      ['unknown kind', { kind: 'everything' }],
      ['clusters with no ids', { kind: 'clusters' }],
      ['ids as a bare string (would degrade to a substring match)', {
        kind: 'clusters',
        ids: 'someSubstring',
      }],
      ['ids that are not object ids', { kind: 'projects', ids: ['not-an-id'] }],
    ])('rejects a malformed access restriction: %s', async (_label, access) => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      const response = await approve(token, { userCode, access });

      expect(response.status).toBe(400);
    });

    it('rejects scopes with an unknown resource or action', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      const response = await approve(token, {
        userCode,
        scopes: [{ resource: 'everything', action: 'admin' }],
      });

      expect(response.status).toBe(400);
    });
  });

  describe('minted CLI keys always expire', () => {
    it('sets an expiry on the key it mints', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { userCode } = await start();

      const approveResponse = await approve(token, { userCode });
      expect(approveResponse.status).toBe(200);
      expect(typeof approveResponse.body.expiresAt).toBe('string');

      const listResponse = await request(server())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].expiresAt).toBeTruthy();
      expect(new Date(listResponse.body[0].expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
