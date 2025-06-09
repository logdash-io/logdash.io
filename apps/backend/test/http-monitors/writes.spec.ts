import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';
import { CreateHttpMonitorBody } from '../../src/http-monitor/core/dto/create-http-monitor.body';
import { Types } from 'mongoose';
import { UpdateHttpMonitorBody } from '../../src/http-monitor/core/dto/update-http-monitor.body';

describe('HttpMonitorCoreController (writes)', () => {
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

  describe('POST /projects/:projectId/http_monitors', () => {
    it('creates new monitor', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const dto: CreateHttpMonitorBody = {
        name: 'some name',
        url: 'https://google.com',
        notificationChannelIds: [new Types.ObjectId().toString()],
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      const entity = await bootstrap.models.httpMonitorModel.findOne();
      expect(response.status).toBe(201);
      expect(entity).toMatchObject({
        ...dto,
        projectId: project.id,
      });
    });

    it('throws error for invalid url', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const dtoStub = { name: 'Test Monitor', url: 'https://example.com/<>' };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send(dtoStub);

      // then
      expect(response.status).toBe(400);
    });

    it('throws error when cluster has reached monitor limit', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const maxMonitors = getProjectPlanConfig(project.tier).httpMonitors.maxNumberOfMonitors;

      // Create monitors up to the limit
      for (let i = 0; i < maxMonitors; i++) {
        await bootstrap.models.httpMonitorModel.create({
          projectId: project.id,
          name: `Monitor ${i}`,
          url: 'https://example.com',
        });
      }

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'One More Monitor', url: 'https://example.com' });

      // then
      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You have reached the maximum number of monitors for this project',
      );
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { token: creatorToken, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Test Monitor', url: 'https://example.com' });

      // then
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /http_monitors/:httpMonitorId', () => {
    it('updates monitor', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: project.id,
        token,
      });

      const dto: UpdateHttpMonitorBody = {
        name: 'Updated Monitor',
        url: 'https://updated-url.com',
        notificationChannelIds: [new Types.ObjectId().toString()],
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      const entity = await bootstrap.models.httpMonitorModel.findOne();
      expect(response.status).toBe(200);
      expect(entity).toMatchObject({
        ...dto,
      });
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { token: creatorToken, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: project.id,
        token: creatorToken,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Updated Monitor', url: 'https://updated-url.com' });

      // then
      expect(response.status).toBe(403);
    });
  });
});
