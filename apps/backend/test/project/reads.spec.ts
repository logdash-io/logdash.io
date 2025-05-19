import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from '../utils/bootstrap';
import { ProjectSerialized } from '../../src/project/core/entities/project.interface';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { ProjectFeature } from '../../src/project/core/enums/project-feature.enum';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { RateLimitScope } from '../../src/shared/enums/rate-limit-scope.enum';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';

describe('ProjectCoreController (reads)', () => {
  let app: INestApplication<App>;
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();

    app = bootstrap.app;
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /clusters/:clusterId/projects', () => {
    it('reads projects in cluster', async () => {
      // given
      const { token, cluster } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(app.getHttpServer())
        .get(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`);

      const projects = response.body as ProjectSerialized[];

      expect(projects).toHaveLength(1);
      expect(projects[0].clusterId).toEqual(cluster.id);
    });

    describe('project features', () => {
      it('returns empty features array when project has no features', async () => {
        // given
        const { token, cluster, project } =
          await bootstrap.utils.generalUtils.setupAnonymous();

        // when
        const response = await request(app.getHttpServer())
          .get(`/clusters/${cluster.id}/projects`)
          .set('Authorization', `Bearer ${token}`);

        // then
        const projects = response.body as ProjectSerialized[];
        expect(projects[0].features).toEqual([]);
      });

      it('returns logs feature when project has logs', async () => {
        // given
        const { token, cluster, project, apiKey } =
          await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.logUtils.createLog({
          message: 'Test log',
          level: LogLevel.Info,
          createdAt: new Date().toISOString(),
          apiKey: apiKey.value,
        });

        // when
        const response = await request(app.getHttpServer())
          .get(`/clusters/${cluster.id}/projects`)
          .set('Authorization', `Bearer ${token}`);

        // then
        const projects = response.body as ProjectSerialized[];
        expect(projects[0].features).toContain(ProjectFeature.logging);
        expect(projects[0].features).not.toContain(ProjectFeature.metrics);
      });

      it('returns metrics feature when project has metrics', async () => {
        // given
        const { token, cluster, apiKey } =
          await bootstrap.utils.generalUtils.setupAnonymous();

        await bootstrap.utils.metricUtils.recordMetric({
          name: 'TestMetric',
          value: 10,
          apiKey: apiKey.value,
          operation: MetricOperation.Set,
        });

        // when
        const response = await request(app.getHttpServer())
          .get(`/clusters/${cluster.id}/projects`)
          .set('Authorization', `Bearer ${token}`);

        // then
        const projects = response.body as ProjectSerialized[];
        expect(projects[0].features).toContain(ProjectFeature.metrics);
        expect(projects[0].features).not.toContain(ProjectFeature.logging);
      });

      it('returns both features when project has logs and metrics', async () => {
        // given
        const { token, cluster, apiKey } =
          await bootstrap.utils.generalUtils.setupAnonymous();

        await Promise.all([
          bootstrap.utils.logUtils.createLog({
            message: 'Test log',
            level: LogLevel.Info,
            createdAt: new Date().toISOString(),
            apiKey: apiKey.value,
          }),
          bootstrap.utils.metricUtils.recordMetric({
            name: 'TestMetric',
            value: 10,
            apiKey: apiKey.value,
            operation: MetricOperation.Set,
          }),
        ]);

        // when
        const response = await request(app.getHttpServer())
          .get(`/clusters/${cluster.id}/projects`)
          .set('Authorization', `Bearer ${token}`);

        // then
        const projects = response.body as ProjectSerialized[];
        const features = projects[0].features || [];
        expect(features).toContain(ProjectFeature.logging);
        expect(features).toContain(ProjectFeature.metrics);
        expect(features.length).toBe(2);
      });
    });

    it('returns 403 for non-cluster member', async () => {
      // given
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: nonMemberToken } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(app.getHttpServer())
        .get(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      // then
      expect(response.status).toBe(403);
    });
  });

  describe('GET /projects/:projectId', () => {
    it('reads project by id and returns rate limits with no usage', async () => {
      // given
      const { token, project } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const projectDetails = response.body as ProjectSerialized;
      expect(projectDetails.id).toEqual(project.id);
      expect(projectDetails.rateLimits).toBeDefined();
      expect(projectDetails.rateLimits).toHaveLength(1);

      const rateLimit = projectDetails.rateLimits?.find(
        (rateLimit) => rateLimit.scope === RateLimitScope.ProjectLogsPerHour,
      )!;

      expect(rateLimit.scope).toEqual(RateLimitScope.ProjectLogsPerHour);
      expect(rateLimit.currentUsage).toEqual(0);

      const expectedLimit = getProjectPlanConfig(project.tier).logs
        .rateLimitPerHour;
      expect(rateLimit.limit).toEqual(expectedLimit);
    });

    it('reads project by id and returns rate limits with some usage', async () => {
      // given
      const { token, project, apiKey } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // Create some logs to simulate usage
      await Promise.all([
        bootstrap.utils.logUtils.createLog({
          message: 'Test log 1 for rate limit',
          level: LogLevel.Info,
          createdAt: new Date().toISOString(),
          apiKey: apiKey.value,
        }),
        bootstrap.utils.logUtils.createLog({
          message: 'Test log 2 for rate limit',
          level: LogLevel.Error,
          createdAt: new Date().toISOString(),
          apiKey: apiKey.value,
        }),
      ]);

      // when
      const response = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const projectDetails = response.body as ProjectSerialized;
      expect(projectDetails.id).toEqual(project.id);
      expect(projectDetails.rateLimits).toBeDefined();
      expect(projectDetails.rateLimits).toHaveLength(1);

      const rateLimit = projectDetails.rateLimits?.find(
        (rateLimit) => rateLimit.scope === RateLimitScope.ProjectLogsPerHour,
      )!;

      expect(rateLimit.scope).toEqual(RateLimitScope.ProjectLogsPerHour);
      expect(rateLimit.currentUsage).toEqual(2);

      const expectedLimit = getProjectPlanConfig(project.tier).logs
        .rateLimitPerHour;
      expect(rateLimit.limit).toEqual(expectedLimit);
    });

    it('returns 403 for non-cluster member', async () => {
      // given
      const { project: projectOfUserA } =
        await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: nonMemberToken } =
        await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectOfUserA.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      // then
      expect(response.status).toBe(403);
    });
  });
});
