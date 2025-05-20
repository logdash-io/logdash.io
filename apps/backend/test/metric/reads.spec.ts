import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';
import {
  MetricSerialized,
  SimpleMetric,
} from '../../src/metric/core/entities/metric.normalized';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';

describe('Metrics (reads)', () => {
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

  describe('GET /projects/:projectId/metrics', () => {
    it('returns current metric values', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      // record two different metrics
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setup.apiKey.value,
        name: 'UsersCount',
        operation: MetricOperation.Set,
        value: 10,
      });
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setup.apiKey.value,
        name: 'UsersCount',
        operation: MetricOperation.Change,
        value: 1,
      });

      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setup.apiKey.value,
        name: 'ActiveUsers',
        operation: MetricOperation.Set,
        value: 5,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setup.project.id}/metrics`)
        .set('Authorization', `Bearer ${setup.token}`);

      const body = response.body as SimpleMetric[];

      // then
      expect(response.status).toEqual(200);
      expect(body).toHaveLength(2);

      const usersCountMetric = body.find(
        (metric) => metric.name === 'UsersCount',
      )!;
      expect(usersCountMetric).toBeDefined();
      expect(usersCountMetric.value).toEqual(11);

      const activeUsersMetric = body.find(
        (metric) => metric.name === 'ActiveUsers',
      )!;
      expect(activeUsersMetric).toBeDefined();
      expect(activeUsersMetric.value).toEqual(5);
    });

    it('returns 403 if user does not belong to project', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/metrics`)
        .set('Authorization', `Bearer ${setupB.token}`);

      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        'User is not a member of this cluster',
      );
    });
  });

  describe('GET /projects/:projectId/metrics/:metricRegisterEntryId', () => {
    it('returns metrics for the specified register entry', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // metric in this project
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setupA.apiKey.value,
        name: 'UsersCount',
        operation: MetricOperation.Set,
        value: 1,
      });

      // metric in other project
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setupB.apiKey.value,
        name: 'UsersCount',
        operation: MetricOperation.Set,
        value: 2,
      });

      // Get metric register entry id for project A
      const metricRegisterEntriesA =
        await bootstrap.models.metricRegisterModel.find({
          projectId: setupA.project.id,
          name: 'UsersCount',
        });
      expect(metricRegisterEntriesA.length).toEqual(1);
      const metricRegisterEntryId = metricRegisterEntriesA[0]._id.toString();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/metrics/${metricRegisterEntryId}`)
        .set('Authorization', `Bearer ${setupA.token}`);

      const body = response.body as MetricSerialized[];

      // then
      expect(response.status).toEqual(200);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].value).toEqual(1);
      expect(body[0].name).toEqual('UsersCount');
      expect(body[0].metricRegisterEntryId).toEqual(metricRegisterEntryId);
    });

    it('returns 403 when register entry belongs to different project', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // metric in other project
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setupB.apiKey.value,
        name: 'UsersCount',
        operation: MetricOperation.Set,
        value: 2,
      });

      // Get metric register entry id for project B
      const metricRegisterEntriesB =
        await bootstrap.models.metricRegisterModel.find({
          projectId: setupB.project.id,
          name: 'UsersCount',
        });
      expect(metricRegisterEntriesB.length).toEqual(1);
      const metricRegisterEntryId = metricRegisterEntriesB[0]._id.toString();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/metrics/${metricRegisterEntryId}`)
        .set('Authorization', `Bearer ${setupA.token}`);

      // then
      expect(response.status).toEqual(403);
    });

    it('returns 404 when register entry does not exist', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId that doesn't exist

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/metrics/${nonExistentId}`)
        .set('Authorization', `Bearer ${setupA.token}`);

      // then
      expect(response.status).toEqual(404);
    });

    it('returns 403 if user does not belong to project', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a metric to get a valid metric register entry ID
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setupA.apiKey.value,
        name: 'UsersCount',
        operation: MetricOperation.Set,
        value: 1,
      });

      // Get metric register entry id
      const metricRegisterEntries =
        await bootstrap.models.metricRegisterModel.find({
          projectId: setupA.project.id,
          name: 'UsersCount',
        });
      const metricRegisterEntryId = metricRegisterEntries[0]._id.toString();

      // when - user from setupB tries to access project from setupA
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/metrics/${metricRegisterEntryId}`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        'User is not a member of this cluster',
      );
    });
  });
});
