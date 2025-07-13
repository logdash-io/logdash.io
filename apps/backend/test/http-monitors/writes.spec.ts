import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';
import { CreateHttpMonitorBody } from '../../src/http-monitor/core/dto/create-http-monitor.body';
import { Types } from 'mongoose';
import { UpdateHttpMonitorBody } from '../../src/http-monitor/core/dto/update-http-monitor.body';
import {
  AuditLogEntityAction,
  AuditLogHttpMonitorAction,
  AuditLogNotificationChannelAction,
} from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';

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

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: project.clusterId,
          token,
        });

      const dto: CreateHttpMonitorBody = {
        name: 'some name',
        url: 'https://google.com',
        notificationChannelsIds: [notificationChannel.id],
        mode: HttpMonitorMode.Pull,
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

    it('throws error when notification channels do not belong to the same cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setupB.cluster.id,
          token: setupB.token,
          options: {
            chatId: 'some-chat-id',
          },
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${setupA.project.id}/http_monitors`)
        .set('Authorization', `Bearer ${setupA.token}`)
        .send({
          name: 'Test Monitor',
          url: 'https://example.com',
          notificationChannelsIds: [notificationChannel.id],
        });

      // then
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Notification channels must belong to the same cluster');
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

    it('creates audit log when monitor is created', async () => {
      // given
      const { token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: project.clusterId,
          token,
        });

      const dto: CreateHttpMonitorBody = {
        name: 'some name',
        url: 'https://google.com',
        notificationChannelsIds: [notificationChannel.id],
        mode: HttpMonitorMode.Pull,
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: response.body.id,
      });
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
        notificationChannelsIds: [new Types.ObjectId().toString()],
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

    it('creates audit log when monitor is updated', async () => {
      // given
      const { token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: project.id,
        token,
      });

      const dto: UpdateHttpMonitorBody = {
        name: 'Updated Monitor',
        url: 'https://updated-url.com',
        notificationChannelsIds: [new Types.ObjectId().toString()],
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Update,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: httpMonitor.id,
      });
    });
  });

  describe('DELETE /http_monitors/:httpMonitorId', () => {
    it('deletes monitor and related resouces', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const httpPing = await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: httpMonitor.id,
      });

      const httpPingBucket = await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: httpMonitor.id,
      });

      const monitorsBeforeRemoval = await bootstrap.models.httpMonitorModel.find();
      const pingsBeforeRemoval = await bootstrap.utils.httpPingUtils.getAllPings();
      const bucketsBeforeRemoval = await bootstrap.utils.httpPingBucketUtils.getAllBuckets();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      const monitorsAfterRemoval = await bootstrap.models.httpMonitorModel.find();
      const pingsAfterRemoval = await bootstrap.utils.httpPingUtils.getAllPings();
      const bucketsAfterRemoval = await bootstrap.utils.httpPingBucketUtils.getAllBuckets();

      expect(monitorsAfterRemoval).toHaveLength(monitorsBeforeRemoval.length - 1);
      expect(pingsAfterRemoval).toHaveLength(pingsBeforeRemoval.length - 1);
      expect(bucketsAfterRemoval).toHaveLength(bucketsBeforeRemoval.length - 1);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: setupA.project.id,
        token: setupA.token,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });

    it('creates audit log when monitor is deleted', async () => {
      // given
      const { token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: project.id,
        token,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Delete,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: httpMonitor.id,
      });
    });
  });

  describe('POST /http_monitors/:httpMonitorId/notification_channels/:notificationChannelId', () => {
    it('adds notification channel to monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            chatId: 'some-chat-id',
          },
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${httpMonitor.id}/notification_channels/${notificationChannel.id}`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      const entity = await bootstrap.models.httpMonitorModel.findOne();

      expect(entity).toMatchObject({
        notificationChannelsIds: [notificationChannel.id],
      });
    });

    it('creates audit log when notification channel is added to monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            chatId: 'some-chat-id',
          },
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${httpMonitor.id}/notification_channels/${notificationChannel.id}`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: setup.user.id,
        action: AuditLogHttpMonitorAction.AddedNotificationChannel,
      });

      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: setup.user.id,
        action: AuditLogNotificationChannelAction.AddedToMonitor,
      });
    });
  });

  describe('DELETE /http_monitors/:httpMonitorId/notification_channels/:notificationChannelId', () => {
    it('removes notification channel from monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            chatId: 'some-chat-id',
          },
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${httpMonitor.id}/notification_channels/${notificationChannel.id}`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      const entity = await bootstrap.models.httpMonitorModel.findOne();

      expect(entity).toMatchObject({
        notificationChannelsIds: [],
      });
    });

    it('creates audit log when notification channel is removed from monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            chatId: 'some-chat-id',
          },
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${httpMonitor.id}/notification_channels/${notificationChannel.id}`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: setup.user.id,
        action: AuditLogHttpMonitorAction.RemovedNotificationChannel,
      });
    });
  });
});
