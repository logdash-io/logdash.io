import * as request from 'supertest';
import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { AccessRestriction } from '../../src/personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../src/personal-api-key/core/types/scope-entry.type';
import { ClusterRole } from '../../src/cluster/core/enums/cluster-role.enum';
import { RedisService } from '../../src/shared/redis/redis.service';

describe('Personal API keys (scope + access enforcement)', () => {
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

  // creates a personal API key (under the owner's JWT) and returns its plaintext value
  const createKey = async (
    token: string,
    scopes: ScopeEntry[],
    access: AccessRestriction,
    expiresAt?: string,
  ): Promise<string> => {
    const response = await request(server())
      .post('/personal-api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'test key', scopes, access, expiresAt });

    expect(response.status).toBe(201);
    expect(typeof response.body.value).toBe('string');

    return response.body.value;
  };

  // make `userId` a member of `clusterId` (genuine live membership)
  const addMember = async (clusterId: string, userId: string): Promise<void> => {
    const cluster = await bootstrap.models.clusterModel.findById(clusterId).lean();
    const roles = { ...(cluster!.roles ?? {}), [userId]: ClusterRole.Creator };
    await bootstrap.models.clusterModel.updateOne(
      { _id: new Types.ObjectId(clusterId) },
      { roles },
    );
    await redisService.flushAll();
  };

  describe('scope enforcement (read endpoints)', () => {
    it('allows a read-scoped key on a GET endpoint', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'all' },
      );

      const response = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);
    });

    it('write scope implies read (write key can read)', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        token,
        [{ resource: Resource.Projects, action: Action.Write }],
        { kind: 'all' },
      );

      const response = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);
    });

    it('returns 403 when the key lacks the required scope (none)', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // key has logs:read but the endpoint requires projects:read
      const key = await createKey(
        token,
        [{ resource: Resource.Logs, action: Action.Read }],
        { kind: 'all' },
      );

      const response = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });

    it('returns 403 when the key has an empty scope array', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(token, [], { kind: 'all' });

      const response = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });

    it('enforces the correct resource per endpoint (logs:read works on logs, not metrics)', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        token,
        [{ resource: Resource.Logs, action: Action.Read }],
        { kind: 'all' },
      );

      const logsResponse = await request(server())
        .get(`/projects/${project.id}/logs/v2`)
        .set('Authorization', `Bearer ${key}`);
      expect(logsResponse.status).toBe(200);

      const metricsResponse = await request(server())
        .get(`/projects/${project.id}/metrics`)
        .set('Authorization', `Bearer ${key}`);
      expect(metricsResponse.status).toBe(403);
    });
  });

  describe('fail-closed (unannotated endpoint with a personal key)', () => {
    it('returns 403 for a personal key hitting an endpoint with no @RequireScope (key management)', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // even an all-access key cannot manage keys — the endpoint is unannotated
      const key = await createKey(
        token,
        [{ resource: Resource.Account, action: Action.Write }],
        { kind: 'all' },
      );

      const response = await request(server())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });

    it('returns 403 for a personal key creating another key (credential-mints-credential is closed)', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        token,
        [{ resource: Resource.Account, action: Action.Write }],
        { kind: 'all' },
      );

      const response = await request(server())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${key}`)
        .send({
          label: 'minted',
          scopes: [{ resource: Resource.Logs, action: Action.Read }],
          access: { kind: 'all' },
        });

      expect(response.status).toBe(403);
    });
  });

  describe('access restriction', () => {
    it('projects[P1] -> 403 on P2 even when the user is a member of P2 cluster', async () => {
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const second = await bootstrap.utils.generalUtils.setupAnonymous();

      // owner becomes a genuine member of second's cluster (live membership)
      await addMember(second.cluster.id, owner.user.id);

      // sanity: owner can reach P2 under a project-scoped key for P2
      const keyForP1 = await createKey(
        owner.token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'projects', ids: [owner.project.id] },
      );

      // P1 allowed
      const p1Response = await request(server())
        .get(`/projects/${owner.project.id}`)
        .set('Authorization', `Bearer ${keyForP1}`);
      expect(p1Response.status).toBe(200);

      // P2 denied by access restriction, despite real membership
      const p2Response = await request(server())
        .get(`/projects/${second.project.id}`)
        .set('Authorization', `Bearer ${keyForP1}`);
      expect(p2Response.status).toBe(403);
    });

    it('clusters[C1] -> ok on C1, 403 on C2', async () => {
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const second = await bootstrap.utils.generalUtils.setupAnonymous();

      await addMember(second.cluster.id, owner.user.id);

      const key = await createKey(
        owner.token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'clusters', ids: [owner.cluster.id] },
      );

      const c1Response = await request(server())
        .get(`/clusters/${owner.cluster.id}/projects`)
        .set('Authorization', `Bearer ${key}`);
      expect(c1Response.status).toBe(200);

      const c2Response = await request(server())
        .get(`/clusters/${second.cluster.id}/projects`)
        .set('Authorization', `Bearer ${key}`);
      expect(c2Response.status).toBe(403);
    });

    it('access:all is still bounded by live membership (403 on a cluster the user is not in)', async () => {
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const stranger = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        owner.token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'all' },
      );

      // owner is NOT a member of stranger's cluster
      const response = await request(server())
        .get(`/clusters/${stranger.cluster.id}/projects`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });

    it('a project-scoped key cannot use a cluster-level endpoint', async () => {
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        owner.token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'projects', ids: [owner.project.id] },
      );

      const response = await request(server())
        .get(`/clusters/${owner.cluster.id}/projects`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });

    it('user removed from a cluster loses access on the key within the cache TTL', async () => {
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const second = await bootstrap.utils.generalUtils.setupAnonymous();

      await addMember(second.cluster.id, owner.user.id);

      const key = await createKey(
        owner.token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'all' },
      );

      // member -> allowed
      const before = await request(server())
        .get(`/clusters/${second.cluster.id}/projects`)
        .set('Authorization', `Bearer ${key}`);
      expect(before.status).toBe(200);

      // remove membership live + bust the 5s role cache
      const cluster = await bootstrap.models.clusterModel.findById(second.cluster.id).lean();
      const roles = { ...(cluster!.roles ?? {}) };
      delete roles[owner.user.id];
      await bootstrap.models.clusterModel.updateOne(
        { _id: new Types.ObjectId(second.cluster.id) },
        { roles },
      );
      await redisService.flushAll();

      const after = await request(server())
        .get(`/clusters/${second.cluster.id}/projects`)
        .set('Authorization', `Bearer ${key}`);
      expect(after.status).toBe(403);
    });
  });

  describe('lifecycle (401)', () => {
    it('expired key -> 401', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        token,
        [{ resource: Resource.Projects, action: Action.Read }],
        { kind: 'all' },
        new Date(Date.now() - 60_000).toISOString(),
      );

      const response = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(401);
    });

    it('revoked key -> 401', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const createResponse = await request(server())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          label: 'to revoke',
          scopes: [{ resource: Resource.Projects, action: Action.Read }],
          access: { kind: 'all' },
        });

      const keyId = createResponse.body.id;
      const value = createResponse.body.value;

      // works before revocation
      const before = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${value}`);
      expect(before.status).toBe(200);

      // revoke (under JWT) + bust the auth cache
      await request(server())
        .delete(`/personal-api-keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`);
      await redisService.flushAll();

      const after = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${value}`);
      expect(after.status).toBe(401);
    });

    it('garbage ldp_ value -> 401', async () => {
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ldp_thisisnotarealkeyvalue00000`);

      expect(response.status).toBe(401);
    });
  });

  describe('whoami (any valid key, regardless of scope)', () => {
    it('works for a key with empty scopes and a narrow access restriction', async () => {
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(token, [], { kind: 'projects', ids: [] });

      const response = await request(server())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(user.id);
      expect(response.body.scopes).toEqual([]);
      expect(response.body.access).toEqual({ kind: 'projects', ids: [] });
    });

    it('returns 401 for whoami with a revoked key', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const createResponse = await request(server())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ label: 'k', scopes: [], access: { kind: 'all' } });

      const keyId = createResponse.body.id;
      const value = createResponse.body.value;

      await request(server())
        .delete(`/personal-api-keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`);
      await redisService.flushAll();

      const response = await request(server())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${value}`);

      expect(response.status).toBe(401);
    });

    it('returns 401 for whoami with an expired key', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const value = await createKey(
        token,
        [],
        { kind: 'all' },
        new Date(Date.now() - 60_000).toISOString(),
      );

      const response = await request(server())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${value}`);

      expect(response.status).toBe(401);
    });
  });

  describe('JWT regression (unaffected by scope annotations)', () => {
    it('JWT reaches every annotated endpoint regardless of scope metadata', async () => {
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token, cluster, project } = setup;

      // create a metric register entry + a monitor so the by-id endpoints resolve
      const monitorResponse = await request(server())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'mon', url: 'https://example.com', mode: 'pull' });
      const monitorId = monitorResponse.body.id;

      const cases: Array<{ path: string; min?: number }> = [
        { path: `/clusters/${cluster.id}/projects` },
        { path: `/projects/${project.id}` },
        { path: `/projects/${project.id}/logs/v2` },
        { path: `/projects/${project.id}/metrics` },
        { path: `/projects/${project.id}/http_monitors` },
        { path: `/clusters/${cluster.id}/http_monitors` },
        { path: `/projects/${project.id}/monitors/${monitorId}/http_pings` },
        { path: `/users/me` },
      ];

      for (const c of cases) {
        const response = await request(server())
          .get(c.path)
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      }
    });
  });
});
