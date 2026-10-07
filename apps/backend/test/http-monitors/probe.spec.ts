import nock from 'nock';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { AccessRestriction } from '../../src/personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../src/personal-api-key/core/types/scope-entry.type';
import { CreatePersonalApiKeyResponse } from '../../src/personal-api-key/core/dto/create-personal-api-key.response';
import { ProbeHttpMonitorUrlBody } from '../../src/http-monitor/core/dto/probe-http-monitor-url.body';
import { ProbeHttpMonitorUrlResponse } from '../../src/http-monitor/core/dto/probe-http-monitor-url.response';
import { MAX_HEALTH_BODY_BYTES } from '../../src/http-monitor/probe/http-monitor-probe.service';

type Reply = [status: number, body: string | Record<string, unknown>];

const ORIGIN = 'https://example.com';
const MADE_UP_PATH = /^\/logdash-probe-[0-9a-f-]{36}$/;
const SPA_PAGE = '<!doctype html><div id="app"></div>';

describe('HttpMonitorCoreController (probe)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const server = () => bootstrap.app.getHttpServer();

  const mockHost = (params: { madeUp: Reply; paths: Record<string, Reply> }): void => {
    nock(ORIGIN)
      .get(MADE_UP_PATH)
      .reply(...params.madeUp);

    for (const [path, reply] of Object.entries(params.paths)) {
      nock(ORIGIN)
        .get(path)
        .reply(...reply);
    }
  };

  const probe = (token: string, projectId: string, url: string): request.Test => {
    const body: ProbeHttpMonitorUrlBody = { url };

    return request(server())
      .post(`/projects/${projectId}/http_monitors/probe`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  };

  const createKey = async (
    token: string,
    scopes: ScopeEntry[],
    access: AccessRestriction = { kind: 'all' },
  ): Promise<string> => {
    const response = await request(server())
      .post('/personal-api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'probe', scopes, access });

    expect(response.status).toBe(201);

    return (response.body as CreatePersonalApiKeyResponse).value;
  };

  describe('POST /projects/:projectId/http_monitors/probe', () => {
    it('flags a host that answers a made up path with the same page as the url', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      mockHost({
        madeUp: [200, SPA_PAGE],
        paths: {
          '/': [200, SPA_PAGE],
          '/health': [200, SPA_PAGE],
          '/api/health': [200, SPA_PAGE],
          '/up': [200, SPA_PAGE],
        },
      });

      // when
      const response = await probe(token, project.id, `${ORIGIN}/`);

      // then
      expect(response.status).toBe(200);
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: true,
        healthPaths: [],
      });
    });

    it('compares bodies as text, so a catch-all answering json is flagged too', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      mockHost({
        madeUp: [200, { status: 'ok' }],
        paths: {
          '/': [200, { status: 'ok' }],
          '/health': [200, { status: 'ok' }],
          '/api/health': [200, { status: 'ok' }],
          '/up': [200, { status: 'ok' }],
        },
      });

      // when
      const response = await probe(token, project.id, ORIGIN);

      // then
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: true,
        healthPaths: [],
      });
    });

    it('finds a real health path on a catch-all host', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      mockHost({
        madeUp: [200, SPA_PAGE],
        paths: {
          '/': [200, SPA_PAGE],
          '/health': [200, SPA_PAGE],
          '/api/health': [200, { status: 'ok' }],
          '/up': [200, SPA_PAGE],
        },
      });

      // when
      const response = await probe(token, project.id, ORIGIN);

      // then
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: true,
        healthPaths: ['/api/health'],
      });
    });

    it('finds health paths on a host that answers unknown paths with 404', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      mockHost({
        madeUp: [404, 'Not found'],
        paths: {
          '/': [200, 'Home'],
          '/health': [200, 'ok'],
          '/api/health': [404, 'Not found'],
        },
      });
      nock(ORIGIN).get('/up').replyWithError('socket hang up');

      // when
      const response = await probe(token, project.id, ORIGIN);

      // then
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: false,
        healthPaths: ['/health'],
      });
    });

    it('does not suggest a health path that answers with a full page', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const profilePage = `<!doctype html><h1>up</h1>${'<p>repository</p>'.repeat(MAX_HEALTH_BODY_BYTES / 16)}`;
      mockHost({
        madeUp: [404, 'Not found'],
        paths: {
          '/': [200, 'Home'],
          '/health': [200, 'ok'],
          '/api/health': [404, 'Not found'],
          '/up': [200, profilePage],
        },
      });

      // when
      const response = await probe(token, project.id, ORIGIN);

      // then
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: false,
        healthPaths: ['/health'],
      });
    });

    it('does not suggest the path the url already points at', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      nock(ORIGIN).persist().get('/health').reply(200, 'ok');
      mockHost({
        madeUp: [404, 'Not found'],
        paths: {
          '/api/health': [404, 'Not found'],
          '/up': [200, 'up'],
        },
      });

      // when
      const response = await probe(token, project.id, `${ORIGIN}/health/`);

      // then
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: false,
        healthPaths: ['/up'],
      });
    });

    it('rejects an unsafe url', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await probe(token, project.id, 'http://169.254.169.254/latest/meta-data');

      // then
      expect(response.status).toBe(400);
    });

    it.each([
      'http://[64:ff9b::a9fe:a9fe]/latest/meta-data',
      'http://[64:ff9b:1::a9fe:a9fe]/latest/meta-data',
      'http://[2002:a9fe:a9fe::]/latest/meta-data',
    ])('rejects %s, an ipv6 address that translates to ipv4', async (url) => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await probe(token, project.id, url);

      // then
      expect(response.status).toBe(400);
    });

    it('rejects a request without a token', async () => {
      // given
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(server())
        .post(`/projects/${project.id}/http_monitors/probe`)
        .send({ url: ORIGIN });

      // then
      expect(response.status).toBe(401);
    });

    it('forbids a user from another cluster', async () => {
      // given
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await probe(setupB.token, project.id, ORIGIN);

      // then
      expect(response.status).toBe(403);
    });

    it('lets a monitors write key probe, but not a read key or a key for another project', async () => {
      // given
      const { token, project, user, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const otherProject = await bootstrap.utils.projectUtils.createDefaultProject({
        userId: user.id,
        clusterId: cluster.id,
      });
      const writeScopes = [{ resource: Resource.Monitors, action: Action.Write }];
      const writeKey = await createKey(token, writeScopes);
      const readKey = await createKey(token, [
        { resource: Resource.Monitors, action: Action.Read },
      ]);
      const otherProjectKey = await createKey(token, writeScopes, {
        kind: 'projects',
        ids: [otherProject.id],
      });
      nock(ORIGIN).persist().get(/.*/).reply(404);

      // when
      const allowed = await probe(writeKey, project.id, ORIGIN);
      const deniedRead = await probe(readKey, project.id, ORIGIN);
      const deniedOtherProject = await probe(otherProjectKey, project.id, ORIGIN);

      // then
      expect(allowed.status).toBe(200);
      expect(deniedRead.status).toBe(403);
      expect(deniedOtherProject.status).toBe(403);
    });

    it('refuses the 31st probe from one address within a minute', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      nock(ORIGIN).persist().get(/.*/).reply(404);

      // when
      const statuses: number[] = [];
      for (let i = 0; i < 31; i++) {
        statuses.push((await probe(token, project.id, ORIGIN)).status);
      }

      // then
      expect(statuses.slice(0, 30)).toEqual(Array.from({ length: 30 }, () => 200));
      expect(statuses[30]).toBe(429);
    });
  });

  describe('POST /clusters/:clusterId/http_monitors/probe', () => {
    const probeInCluster = (token: string, clusterId: string, url: string): request.Test => {
      const body: ProbeHttpMonitorUrlBody = { url };

      return request(server())
        .post(`/clusters/${clusterId}/http_monitors/probe`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    };

    it('probes a url for the domain', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      mockHost({
        madeUp: [404, 'Not found'],
        paths: {
          '/': [200, 'Home'],
          '/health': [200, 'ok'],
          '/api/health': [404, 'Not found'],
          '/up': [404, 'Not found'],
        },
      });

      // when
      const response = await probeInCluster(token, cluster.id, ORIGIN);

      // then
      expect(response.status).toBe(200);
      expect(response.body as ProbeHttpMonitorUrlResponse).toEqual({
        catchAll: false,
        healthPaths: ['/health'],
      });
    });

    it('forbids a user from another cluster and a monitors read key', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const readKey = await createKey(token, [
        { resource: Resource.Monitors, action: Action.Read },
      ]);

      // when
      const otherCluster = await probeInCluster(setupB.token, cluster.id, ORIGIN);
      const deniedRead = await probeInCluster(readKey, cluster.id, ORIGIN);

      // then
      expect(otherCluster.status).toBe(403);
      expect(deniedRead.status).toBe(403);
    });
  });
});
