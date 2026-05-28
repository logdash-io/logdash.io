import * as request from 'supertest';
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
    return response.body.value;
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
    projectId: string,
    name: string,
    status: HttpMonitorStatus,
  ): Promise<string> => {
    const created = await bootstrap.models.httpMonitorModel.create({
      projectId,
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
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      await seedErrorLogs(project.id, 3);
      await seedInfoLog(project.id); // must not be counted
      await seedMetric(project.id);
      await seedMonitor(project.id, 'api', HttpMonitorStatus.Down);

      const response = await request(server())
        .get(`/projects/${project.id}/overview`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].projectId).toBe(project.id);
      expect(response.body.errors[0].errorCount).toBe(3);

      expect(response.body.monitors).toHaveLength(1);
      expect(response.body.monitors[0].status).toBe(HttpMonitorStatus.Down);
      expect(response.body.monitorsDown).toBe(1);

      expect(response.body.dataFlow).toHaveLength(1);
      expect(response.body.dataFlow[0].projectId).toBe(project.id);
      expect(response.body.dataFlow[0].lastLogReceivedAt).not.toBeNull();
      expect(response.body.dataFlow[0].lastMetricReceivedAt).not.toBeNull();
    });

    it('reports null data flow when no logs/metrics were ever received', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get(`/projects/${project.id}/overview`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.dataFlow[0].lastLogReceivedAt).toBeNull();
      expect(response.body.dataFlow[0].lastMetricReceivedAt).toBeNull();
      expect(response.body.errors[0].errorCount).toBe(0);
    });

    it('rejects a malformed since value with 400', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get(`/projects/${project.id}/overview?since=banana`)
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
      const secondProjectId = secondProjectResponse.body.project.id;

      await seedErrorLogs(project.id, 2);
      await seedErrorLogs(secondProjectId, 5);

      const response = await request(server())
        .get(`/clusters/${cluster.id}/overview`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toHaveLength(2);
      // worst first
      expect(response.body.errors[0].projectId).toBe(secondProjectId);
      expect(response.body.errors[0].errorCount).toBe(5);
      expect(response.body.errors[1].errorCount).toBe(2);
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
      const secondClusterId = secondClusterResponse.body.id;

      const secondProjectResponse = await request(server())
        .post(`/clusters/${secondClusterId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'p2' });
      const secondProjectId = secondProjectResponse.body.project.id;

      await seedErrorLogs(project.id, 1);
      await seedErrorLogs(secondProjectId, 1);

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const projectIds = response.body.errors.map((e: any) => e.projectId).sort();
      expect(projectIds).toEqual([project.id, secondProjectId].sort());
    });

    it('a personal key scoped to projects[P1] sees only P1 on GET /overview, never P2', async () => {
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // P2 in the same cluster — same membership, so only the access restriction excludes it
      const secondProjectResponse = await request(server())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'p2' });
      const p2Id = secondProjectResponse.body.project.id;

      await seedErrorLogs(project.id, 4);
      await seedErrorLogs(p2Id, 9);

      const key = await createKey(
        token,
        [{ resource: Resource.Clusters, action: Action.Read }],
        { kind: 'projects', ids: [project.id] },
      );
      await redisService.flushAll();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);

      const projectIds = response.body.errors.map((e: any) => e.projectId);
      expect(projectIds).toEqual([project.id]);
      expect(projectIds).not.toContain(p2Id);

      const dataFlowIds = response.body.dataFlow.map((d: any) => d.projectId);
      expect(dataFlowIds).toEqual([project.id]);
    });

    it('a personal key scoped to clusters[C1] sees only C1 projects on GET /overview', async () => {
      const { token, cluster, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const secondClusterResponse = await request(server())
        .post('/users/me/clusters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'cluster 2' });
      const secondClusterId = secondClusterResponse.body.id;

      const secondProjectResponse = await request(server())
        .post(`/clusters/${secondClusterId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'p2' });
      const p2Id = secondProjectResponse.body.project.id;

      const key = await createKey(
        token,
        [{ resource: Resource.Clusters, action: Action.Read }],
        { kind: 'clusters', ids: [cluster.id] },
      );
      await redisService.flushAll();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(200);
      const projectIds = response.body.dataFlow.map((d: any) => d.projectId);
      expect(projectIds).toEqual([project.id]);
      expect(projectIds).not.toContain(p2Id);
    });

    it('JWT sees everything the user owns (access:all bound)', async () => {
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const projectIds = response.body.dataFlow.map((d: any) => d.projectId);
      expect(projectIds).toContain(project.id);
    });

    it('returns 403 for a personal key without the clusters:read scope', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const key = await createKey(
        token,
        [{ resource: Resource.Logs, action: Action.Read }],
        { kind: 'all' },
      );
      await redisService.flushAll();

      const response = await request(server())
        .get('/overview')
        .set('Authorization', `Bearer ${key}`);

      expect(response.status).toBe(403);
    });
  });
});
