import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { AccessRestriction } from '../../src/personal-api-key/core/types/access-restriction.type';
import { ScopeEntry } from '../../src/personal-api-key/core/types/scope-entry.type';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { HttpMonitorStatus } from '../../src/http-monitor/status/enum/http-monitor-status.enum';
import { HttpMonitorStatusService } from '../../src/http-monitor/status/http-monitor-status.service';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';
import { MetricRegisterEntryType } from '../../src/metric-register/core/entities/metric-register-entry.entity';
import { RedisService } from '../../src/shared/redis/redis.service';
import { CreatePersonalApiKeyResponse } from '../../src/personal-api-key/core/dto/create-personal-api-key.response';
import { CreateProjectResponse } from '../../src/project/core/dto/create-project.response';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';
import {
  ClusterPulseResponse,
  OverviewResponse,
} from '../../src/overview/core/dto/overview.response';
import { WebEventClickhouseEntity } from '../../src/web-analytics/core/entities/web-event.clickhouse-entity';

describe('Overview (aggregation verdict)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let statusService: HttpMonitorStatusService;
  let redisService: RedisService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    statusService = bootstrap.module.get(HttpMonitorStatusService);
    redisService = bootstrap.module.get(RedisService);
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const server = () => bootstrap.app.getHttpServer();

  const createKey = async (
    token: string,
    scopes: ScopeEntry[],
    access: AccessRestriction,
  ): Promise<string> => {
    const response = await request(server())
      .post('/personal-api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'cli key', scopes, access });

    expect(response.status).toBe(201);
    return (response.body as CreatePersonalApiKeyResponse).value;
  };

  // seed N error logs directly into ClickHouse for a project (avoids ingest sleep)
  const seedErrorLogs = async (projectId: string, count: number): Promise<void> => {
    const now = new Date();
    const rows = Array.from({ length: count }).map((_, i) => ({
      id: new Types.ObjectId().toString(),
      project_id: projectId,
      created_at: now.toISOString().replace('T', ' ').replace('Z', ''),
      level: LogLevel.Error,
      message: `boom ${i}`,
      sequence_number: i,
    }));

    await bootstrap.clickhouseClient.insert({
      table: 'logs',
      values: rows,
      format: 'JSONEachRow',
    });
  };

  const seedInfoLog = async (projectId: string): Promise<void> => {
    await bootstrap.clickhouseClient.insert({
      table: 'logs',
      values: [
        {
          id: new Types.ObjectId().toString(),
          project_id: projectId,
          created_at: new Date().toISOString().replace('T', ' ').replace('Z', ''),
          level: LogLevel.Info,
          message: 'hello',
          sequence_number: 0,
        },
      ],
      format: 'JSONEachRow',
    });
  };

  // make a claimed monitor with a known status for a project
  const seedMonitor = async (
    owner: { clusterId: string; projectId: string },
    name: string,
    status: HttpMonitorStatus,
  ): Promise<string> => {
    const created = await bootstrap.models.httpMonitorModel.create({
      ...owner,
      name,
      url: 'https://example.com',
      mode: HttpMonitorMode.Pull,
      claimed: true,
      notificationChannelsIds: [],
    });

    const monitorId = created._id.toString();
    await statusService.setStatus(monitorId, { status, statusCode: '200' });

    return monitorId;
  };

  const seedMetric = async (projectId: string): Promise<void> => {
    await bootstrap.models.metricRegisterModel.create({
      projectId,
      name: 'requests',
      type: MetricRegisterEntryType.Counter,
      values: { counter: { absoluteValue: 1 } },
    });
  };

  describe('project overview', () => {
    it('returns error counts, monitor status and dataFlow for a single project', async () => {
      const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      await seedErrorLogs(project.id, 3);
      await seedInfoLog(project.id); // must not be counted
      await seedMetric(project.id);
      await seedMonitor(
        { clusterId: cluster.id, projectId: project.id },
        'api',
        HttpMonitorStatus.Down,
      );

      const response = await request(server())
        .get(`/projects/${project.id}/overview`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const body = response.body as OverviewResponse;

      expect(body.errors).toHaveLength(1);
      expect(body.errors[0].projectId).toBe(project.id);
      expect(body.errors[0].errorCount).toBe(3);

      expect(body.monitors).toHaveLength(1);
      expect(body.monitors[0]).toMatchObject({
        clusterId: cluster.id,
        projectId: project.id,
        status: HttpMonitorStatus.Down,
      });
      expect(body.monitorsDown).toBe(1);

      expect(body.dataFlow).toHaveLength(1);
      expect(body.dataFlow[0].projectId).toBe(project.id);
      expect(body.dataFlow[0].lastLogReceivedAt).not.toBeNull();
      expect(body.dataFlow[0].lastMetricReceivedAt).not.toBeNull();
    });

    it('reports null data flow when no logs/metrics were ever received', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get(`/projects/${project.id}/overview`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const body = response.body as OverviewResponse;
      expect(body.dataFlow[0].lastLogReceivedAt).toBeNull();
      expect(body.dataFlow[0].lastMetricReceivedAt).toBeNull();
      expect(body.errors[0].errorCount).toBe(0);
    });

    it('rejects a malformed since value with 400', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get(`/projects/${project.id}/overview?since=banana`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('rejects a since value too large to be a date with 400', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get(`/projects/${project.id}/overview?since=99999999999999999999d`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('cluster overview', () => {
    it('aggregates all projects in the cluster', async () => {
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // second project in the same cluster
      const secondProjectResponse = await request(server())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'second' });
      const secondProjectId = (secondProjectResponse.body as CreateProjectResponse).project.id;

      await seedErrorLogs(project.id, 2);
      await seedErrorLogs(secondProjectId, 5);

      const response = await request(server())
        .get(`/clusters/${cluster.id}/overview`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const body = response.body as OverviewResponse;
      expect(body.errors).toHaveLength(2);
      // worst first
      expect(body.errors[0].projectId).toBe(secondProjectId);
      expect(body.errors[0].errorCount).toBe(5);
      expect(body.errors[1].errorCount).toBe(2);
    });
  });

  describe('account-wide overview', () => {
    it('spans all of the user clusters under JWT', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // a second cluster + project for the same user
      const secondClusterResponse = await request(server())
        .post('/users/me/clusters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'cluster 2' });
      const secondClusterId = (secondClusterResponse.body as ClusterSerialized).id;

      const secondProjectResponse = await request(server())
        .post(`/clusters/${secondClusterId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'p2' });
      const secondProjectId = (secondProjectResponse.body as CreateProjectResponse).project.id;

      await seedErrorLogs(project.id, 1);
      await seedErrorLogs(secondProjectId, 1);

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const projectIds = (response.body as OverviewResponse).errors.map((e) => e.projectId).sort();
      expect(projectIds).toEqual([project.id, secondProjectId].sort());
    });

    it('a personal key scoped to projects[P1] sees only P1 on GET /overview, never P2', async () => {
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // P2 in the same cluster — same membership, so only the access restriction excludes it
      const secondProjectResponse = await request(server())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'p2' });
      const p2Id = (secondProjectResponse.body as CreateProjectResponse).project.id;

      await seedErrorLogs(project.id, 4);
      await seedErrorLogs(p2Id, 9);

      const key = await createKey(token, [{ resource: Resource.Clusters, action: Action.Read }], {
        kind: 'projects',
        ids: [project.id],
      });
      await redisService.flushAll();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);

      const body = response.body as OverviewResponse;
      const projectIds = body.errors.map((e) => e.projectId);
      expect(projectIds).toEqual([project.id]);
      expect(projectIds).not.toContain(p2Id);

      const dataFlowIds = body.dataFlow.map((d) => d.projectId);
      expect(dataFlowIds).toEqual([project.id]);
    });

    it('a personal key scoped to clusters[C1] sees only C1 projects on GET /overview', async () => {
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const secondClusterResponse = await request(server())
        .post('/users/me/clusters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'cluster 2' });
      const secondClusterId = (secondClusterResponse.body as ClusterSerialized).id;

      const secondProjectResponse = await request(server())
        .post(`/clusters/${secondClusterId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'p2' });
      const p2Id = (secondProjectResponse.body as CreateProjectResponse).project.id;

      const key = await createKey(token, [{ resource: Resource.Clusters, action: Action.Read }], {
        kind: 'clusters',
        ids: [cluster.id],
      });
      await redisService.flushAll();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);
      const projectIds = (response.body as OverviewResponse).dataFlow.map((d) => d.projectId);
      expect(projectIds).toEqual([project.id]);
      expect(projectIds).not.toContain(p2Id);
    });

    it('JWT sees everything the user owns (access:all bound)', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const projectIds = (response.body as OverviewResponse).dataFlow.map((d) => d.projectId);
      expect(projectIds).toContain(project.id);
    });

    it('returns 403 for a personal key without the clusters:read scope', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(token, [{ resource: Resource.Logs, action: Action.Read }], {
        kind: 'all',
      });
      await redisService.flushAll();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });
  });

  describe('cluster pulse', () => {
    const seedVisit = async (clusterId: string, visitorId: string, minutesAgo: number) => {
      const at = new Date(Date.now() - minutesAgo * 60_000)
        .toISOString()
        .replace('T', ' ')
        .replace('Z', '');
      const row: WebEventClickhouseEntity = {
        id: randomUUID(),
        cluster_id: clusterId,
        site_id: new Types.ObjectId().toString(),
        visitor_id: visitorId.repeat(64),
        session_id: visitorId.repeat(64),
        user_id: '',
        created_at: at,
        received_at: at,
        expires_at: '2099-01-01 00:00:00',
        name: 'pageview',
        hostname: 'example.com',
        path: '/',
        referrer: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        click_id: '',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        country: '',
        props: {},
      };
      await bootstrap.clickhouseClient.insert({
        table: 'web_events',
        values: [row],
        format: 'JSONEachRow',
      });
    };

    it('returns online visitors and down monitors for every cluster of the user only', async () => {
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const stranger = await bootstrap.utils.generalUtils.setupAnonymous();
      const second = (
        await request(server())
          .post('/users/me/clusters')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'second' })
      ).body as ClusterSerialized;

      const down = await seedMonitor(
        { clusterId: cluster.id, projectId: project.id },
        'api',
        HttpMonitorStatus.Down,
      );
      await seedMonitor(
        { clusterId: cluster.id, projectId: project.id },
        'web',
        HttpMonitorStatus.Up,
      );
      await seedMonitor(
        { clusterId: stranger.cluster.id, projectId: stranger.project.id },
        'foreign',
        HttpMonitorStatus.Down,
      );
      await seedVisit(cluster.id, 'a', 1);
      await seedVisit(cluster.id, 'b', 2);
      await seedVisit(cluster.id, 'c', 30);
      await seedVisit(stranger.cluster.id, 'd', 1);

      const response = await request(server())
        .get('/users/me/clusters/pulse')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body as ClusterPulseResponse[]).toEqual(
        expect.arrayContaining([
          { clusterId: cluster.id, online: 2, downMonitorIds: [down] },
          { clusterId: second.id, online: 0, downMonitorIds: [] },
        ]),
      );
      expect(response.body).toHaveLength(2);
    });

    it('is session only', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const key = await createKey(token, [{ resource: Resource.Clusters, action: Action.Read }], {
        kind: 'all',
      });
      await redisService.flushAll();

      expect((await request(server()).get('/users/me/clusters/pulse')).status).toBe(401);
      expect(
        (
          await request(server())
            .get('/users/me/clusters/pulse')
            .set('Authorization', `Bearer ${key}`)
        ).status,
      ).toBe(403);
    });
  });
});
