import { Types } from 'mongoose';
import * as request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';
import { AuditLogEntityAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';

describe('ProjectCoreController (writes)', () => {
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

  describe('PUT /projects/:projectId', () => {
    it('updates project if user is member', async () => {
      // given
      const { user, project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some updated name' });

      // then
      const updatedProject = await bootstrap.models.projectModel.findById(project.id);

      expect(response.status).toBe(200);
      expect(updatedProject!.name).toBe('some updated name');
      expect(updatedProject!.creatorId).toBe(user.id);
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Update,
        relatedDomain: RelatedDomain.Project,
        relatedEntityId: project.id,
      });
    });
  });

  describe('POST /clusters/:clusterId/projects', () => {
    it('creates new project for free user', async () => {
      // given
      const { user, cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name' });

      // then
      const projects = await bootstrap.models.projectModel.find({
        _id: new Types.ObjectId(response.body.project.id),
      });

      const apiKeys = await bootstrap.models.apiKeyModel.find({
        projectId: projects[0].id,
      });

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('some name');
      expect(projects[0].creatorId).toBe(user.id);
      expect(projects[0].clusterId).toBe(cluster.id);

      expect(apiKeys).toHaveLength(1);
      expect(apiKeys[0].projectId).toBe(projects[0].id);
    });

    it('creates new project for early bird user', async () => {
      // given
      const { user, cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'a@a.pl',
        userTier: UserTier.EarlyBird,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name' });

      // then
      const projects = await bootstrap.models.projectModel.find({
        _id: new Types.ObjectId(response.body.project.id),
      });

      expect(projects[0].name).toBe('some name');
      expect(projects[0].tier).toBe(ProjectTier.EarlyBird);
    });

    it('does not let free user create more than 5 projects', async () => {
      // given (ALREADY HAS 1 PROJECT)
      const { project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      for (let i = 0; i < 3; i++) {
        await bootstrap.utils.projectUtils.createDefaultProject({
          clusterId: project.clusterId,
          userId: project.creatorId,
        });
      }

      // when
      const responseA = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${project.clusterId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name 1' });

      const responseB = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${project.clusterId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name 2' });

      // then
      expect(responseA.status).toBe(201);
      expect(responseB.status).toBe(409);
    });

    it('does not let early bird user create more than 20 projects', async () => {
      // given (ALREADY HAS 1 PROJECT)

      const { user, cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'a@a.pl',
        userTier: UserTier.EarlyBird,
      });

      for (let i = 0; i < 18; i++) {
        await bootstrap.utils.projectUtils.createDefaultProject({
          userId: user.id,
          clusterId: cluster.id,
        });
      }

      // when
      const responseA = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name 1' });

      const responseB = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name 2' });

      // then
      expect(responseA.status).toBe(201);
      expect(responseB.status).toBe(409);
    });

    it('does not let user create project if he is not a member of cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${setupA.project.clusterId}/projects`)
        .set('Authorization', `Bearer ${setupB.token}`)
        .send({ name: 'some name' });

      // then
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('User is not a member of this cluster');
    });

    it('creates audit log when project is created', async () => {
      // given
      const { user, cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name' });

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.Project,
        relatedEntityId: response.body.project.id,
      });
    });
  });

  describe('DELETE /projects/:projectId', () => {
    it('deletes project and all related data', async () => {
      // given
      const { user, project, apiKey, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const log = await bootstrap.utils.logUtils.createLog({
        apiKey: apiKey.value,
        createdAt: new Date().toISOString(),
        message: 'testLog',
        level: LogLevel.Silly,
      });

      const metric = await bootstrap.utils.metricUtils.recordMetric({
        apiKey: apiKey.value,
        name: 'testMetric',
        operation: MetricOperation.Change,
        value: 1,
      });

      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: project.id,
        token: token,
      });

      const ping = await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: monitor.id,
      });

      const httpPingBucket = await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: monitor.id,
      });

      const logsBeforeRemoval = await bootstrap.utils.logUtils.readLogs(project.id);
      const metricsBeforeRemoval = await bootstrap.models.metricModel.find({
        projectId: project.id,
      });
      const metricRegisterEntriesBeforeRemoval = await bootstrap.models.metricRegisterModel.find({
        projectId: project.id,
      });
      const projectsBeforeRemoval = await bootstrap.models.projectModel.find({
        _id: new Types.ObjectId(project.id),
      });
      const apiKeysBeforeRemoval = await bootstrap.models.apiKeyModel.find({
        projectId: project.id,
      });
      const httpMonitorsBeforeRemoval = await bootstrap.models.httpMonitorModel.find({
        projectId: project.id,
      });
      const httpPingBucketsBeforeRemoval =
        await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({
          httpMonitorId: monitor.id,
        });
      const httpPingsBeforeRemoval = await bootstrap.utils.httpPingUtils.getMonitorPings({
        httpMonitorId: monitor.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const logsAfterRemoval = await bootstrap.utils.logUtils.readLogs(project.id);
      const metricsAfterRemoval = await bootstrap.models.metricModel.find({
        projectId: project.id,
      });
      const metricRegisterEntriesAfterRemoval = await bootstrap.models.metricRegisterModel.find({
        projectId: project.id,
      });
      const projectsAfterRemoval = await bootstrap.models.projectModel.find({
        _id: new Types.ObjectId(project.id),
      });
      const apiKeysAfterRemoval = await bootstrap.models.apiKeyModel.find({
        projectId: project.id,
      });

      const httpMonitorsAfterRemoval = await bootstrap.models.httpMonitorModel.find({
        projectId: project.id,
      });
      const httpPingsAfterRemoval = await bootstrap.utils.httpPingUtils.getMonitorPings({
        httpMonitorId: monitor.id,
      });
      const httpPingBucketsAfterRemoval =
        await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({
          httpMonitorId: monitor.id,
        });

      expect(response.status).toBe(200);

      expect(logsBeforeRemoval).toHaveLength(1);
      expect(metricsBeforeRemoval).toHaveLength(4);
      expect(metricRegisterEntriesBeforeRemoval).toHaveLength(1);
      expect(projectsBeforeRemoval).toHaveLength(1);
      expect(apiKeysBeforeRemoval).toHaveLength(1);
      expect(httpMonitorsBeforeRemoval).toHaveLength(1);
      expect(httpPingsBeforeRemoval).toHaveLength(1);
      expect(httpPingBucketsBeforeRemoval).toHaveLength(1);

      expect(logsAfterRemoval).toHaveLength(0);
      expect(metricsAfterRemoval).toHaveLength(0);
      expect(metricRegisterEntriesAfterRemoval).toHaveLength(0);
      expect(projectsAfterRemoval).toHaveLength(0);
      expect(apiKeysAfterRemoval).toHaveLength(0);
      expect(httpMonitorsAfterRemoval).toHaveLength(0);
      expect(httpPingsAfterRemoval).toHaveLength(0);
      expect(httpPingBucketsAfterRemoval).toHaveLength(0);
    });

    it('does not let user delete project if he is not a member of cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/projects/${setupA.project.id}`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('User is not a member of this cluster');
    });

    it('returns 401 when unauthorized', async () => {
      // given
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer()).delete(
        `/projects/${project.id}`,
      );

      // then
      expect(response.status).toBe(401);
    });

    it('creates audit log when project is deleted', async () => {
      // given
      const { user, project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Delete,
        relatedDomain: RelatedDomain.Project,
        relatedEntityId: project.id,
      });
    });
  });
});
