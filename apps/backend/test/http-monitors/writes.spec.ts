import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { getUserPlanConfig } from '../../src/shared/configs/user-plan-configs';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
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
import { HttpMonitorSerialized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import nock from 'nock';
import { ErrorResponse } from '../utils/error-response';

describe('HttpMonitorCoreController (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    // `beforeEach` calls nock.cleanAll(), so the telegram interceptor has to be
    // registered after it, once per test.
    await bootstrap.methods.beforeEach();
    // Creating a telegram notification channel posts a setup message to the
    // telegram api. Intercept it so this suite never touches the network.
    nock('https://api.telegram.org')
      .persist()
      .post(/^\/bot[^/]+\/sendMessage/)
      .query(true)
      .reply(200, { ok: true, result: { message_id: 1 } });
  });

  afterAll(async () => {
    nock.cleanAll();
    await bootstrap.methods.afterAll();
  });

  describe('POST /clusters/:clusterId/http_monitors', () => {
    it('denies creating push monitor for non-Pro domain', async () => {
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'push monitor', mode: HttpMonitorMode.Push });

      expect(response.status).toBe(403);
      expect((response.body as ErrorResponse).message).toBe(
        'Push monitors are not available on your plan',
      );
    });

    it('creates new monitor owned by the domain', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          token,
          options: { botToken: '123456:valid-bot-token' },
        });

      const dto: CreateHttpMonitorBody = {
        name: 'some name',
        url: 'https://google.com',
        notificationChannelsIds: [notificationChannel.id],
        mode: HttpMonitorMode.Pull,
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      const entity = await bootstrap.models.httpMonitorModel.findOne().lean();
      expect(response.status).toBe(201);
      expect(entity).toMatchObject({ ...dto, clusterId: cluster.id });
      expect(entity?.projectId).toBeUndefined();
      expect(response.body).toMatchObject({ clusterId: cluster.id });
    });

    it('throws error for invalid url', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const dtoStub = { name: 'Test Monitor', url: 'https://example.com/<>' };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send(dtoStub);

      // then
      expect(response.status).toBe(400);
    });

    it('throws error when domain already holds the unclaimed monitor budget', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      const createMonitor = () =>
        request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/http_monitors`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Unclaimed monitor', url: 'https://example.com' });

      for (let index = 0; index < 3; index++) {
        expect((await createMonitor()).status).toBe(201);
      }

      // when
      const response = await createMonitor();

      // then
      expect(response.status).toBe(409);
      expect((response.body as ErrorResponse).message).toBe(
        'You have reached the maximum number of monitors on your plan',
      );
      expect(await bootstrap.models.httpMonitorModel.countDocuments({ claimed: false })).toBe(3);
    });

    it('refuses the 21st monitor creation from one address within a minute', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Admin,
      });

      // when
      const statuses: number[] = [];
      for (let index = 0; index < 21; index++) {
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/http_monitors`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Monitor', url: 'https://example.com' });

        statuses.push(response.status);

        if (response.status === 201) {
          await request(bootstrap.app.getHttpServer())
            .post(`/http_monitors/${(response.body as HttpMonitorSerialized).id}/claim`)
            .set('Authorization', `Bearer ${token}`);
        }
      }

      // then
      expect(statuses.slice(0, 20)).toEqual(Array.from({ length: 20 }, () => 201));
      expect(statuses[20]).toBe(429);
    });

    it('counts the plan limit across every domain of the owner', async () => {
      // given
      const { token, cluster, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const otherCluster = await bootstrap.utils.projectGroupUtils.storeCluster({
        creatorId: user.id,
      });
      const maxMonitors = getUserPlanConfig(user.tier).httpMonitors.maxNumberOfMonitors;

      for (let index = 0; index < maxMonitors; index++) {
        await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
          clusterId: index % 2 === 0 ? cluster.id : otherCluster.id,
          claimed: true,
        });
      }

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'One More Monitor', url: 'https://example.com' });

      // then
      expect(response.status).toBe(409);
      expect((response.body as ErrorResponse).message).toBe(
        'You have reached the maximum number of monitors on your plan',
      );
    });

    it('throws error when notification channels do not belong to the same domain', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setupB.cluster.id,
          token: setupB.token,
          options: {
            botToken: '123456:valid-bot-token',
            chatId: 'some-chat-id',
          },
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${setupA.cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${setupA.token}`)
        .send({
          name: 'Test Monitor',
          url: 'https://example.com',
          notificationChannelsIds: [notificationChannel.id],
        });

      // then
      expect(response.status).toBe(400);
      expect((response.body as ErrorResponse).message).toBe(
        'Notification channels must belong to the same domain',
      );
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Test Monitor', url: 'https://example.com' });

      // then
      expect(response.status).toBe(403);
    });

    it('creates audit log when monitor is created', async () => {
      // given
      const { token, cluster, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name', url: 'https://google.com' });

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: (response.body as HttpMonitorSerialized).id,
      });
    });
  });

  describe('POST /projects/:projectId/http_monitors', () => {
    it('creates a monitor on the service domain, linked to the service', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'some name', url: 'https://google.com' });

      // then
      expect(response.status).toBe(201);
      expect(await bootstrap.models.httpMonitorModel.findOne().lean()).toMatchObject({
        clusterId: project.clusterId,
        projectId: project.id,
      });
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();
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
    it('denies switching a monitor to push mode for non-Pro domain', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: project.id,
        token,
      });

      const dto: UpdateHttpMonitorBody = { mode: HttpMonitorMode.Push };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      expect(response.status).toBe(403);
      expect((response.body as ErrorResponse).message).toBe(
        'Push monitors are not available on your plan',
      );
      expect(await bootstrap.models.httpMonitorModel.findById(httpMonitor.id)).toMatchObject({
        mode: HttpMonitorMode.Pull,
      });
    });

    it('updates monitor', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: project.id,
        token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: project.clusterId,
          token,
          options: { botToken: '123456:valid-bot-token' },
        });

      const dto: UpdateHttpMonitorBody = {
        name: 'Updated Monitor',
        url: 'https://updated-url.com',
        notificationChannelsIds: [notificationChannel.id],
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

    it('throws error when added notification channels do not belong to the same cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: setupA.project.id,
        token: setupA.token,
      });

      const foreignChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setupB.cluster.id,
          token: setupB.token,
          options: { botToken: '123456:valid-bot-token' },
        });

      const dto: UpdateHttpMonitorBody = { notificationChannelsIds: [foreignChannel.id] };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${setupA.token}`)
        .send(dto);

      // then
      expect(response.status).toBe(400);
      expect((response.body as ErrorResponse).message).toBe(
        'Notification channels must belong to the same domain',
      );
      expect(await bootstrap.models.httpMonitorModel.findById(httpMonitor.id).lean()).toMatchObject(
        { notificationChannelsIds: [] },
      );
    });

    it('keeps channel ids the monitor already holds even if the channel no longer exists', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const deletedChannelId = new Types.ObjectId().toString();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: project.id,
        claimed: true,
        notificationChannelsIds: [deletedChannelId],
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: project.clusterId,
          token,
          options: { botToken: '123456:valid-bot-token' },
        });

      const dto: UpdateHttpMonitorBody = {
        notificationChannelsIds: [deletedChannelId, notificationChannel.id],
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${httpMonitor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(dto);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { token: creatorToken, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
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

    it('rejects a malformed monitor id', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put('/http_monitors/undefined')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Monitor' });

      // then
      expect(response.status).toBe(400);
      expect((response.body as ErrorResponse).message).toBe('Invalid id');
    });

    it('creates audit log when monitor is updated', async () => {
      // given
      const { token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: project.id,
        token,
      });

      const dto: UpdateHttpMonitorBody = {
        name: 'Updated Monitor',
        url: 'https://updated-url.com',
      };

      // when
      await request(bootstrap.app.getHttpServer())
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: httpMonitor.id,
      });

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: httpMonitor.id,
      });

      const monitorsBeforeRemoval = await bootstrap.models.httpMonitorModel.find();
      const pingsBeforeRemoval = await bootstrap.utils.httpPingUtils.getAllPings();
      const bucketsBeforeRemoval = await bootstrap.utils.httpPingBucketUtils.getAllBuckets();

      // when
      await request(bootstrap.app.getHttpServer())
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: project.id,
        token,
      });

      // when
      await request(bootstrap.app.getHttpServer())
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            botToken: '123456:valid-bot-token',
            chatId: 'some-chat-id',
          },
        });

      // when
      await request(bootstrap.app.getHttpServer())
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            botToken: '123456:valid-bot-token',
            chatId: 'some-chat-id',
          },
        });

      // when
      await request(bootstrap.app.getHttpServer())
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            botToken: '123456:valid-bot-token',
            chatId: 'some-chat-id',
          },
        });

      // when
      await request(bootstrap.app.getHttpServer())
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

      const httpMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        projectId: setup.project.id,
        token: setup.token,
      });

      const notificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: setup.cluster.id,
          token: setup.token,
          options: {
            botToken: '123456:valid-bot-token',
            chatId: 'some-chat-id',
          },
        });

      // when
      await request(bootstrap.app.getHttpServer())
        .delete(`/http_monitors/${httpMonitor.id}/notification_channels/${notificationChannel.id}`)
        .set('Authorization', `Bearer ${setup.token}`);

      // then
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: setup.user.id,
        action: AuditLogHttpMonitorAction.RemovedNotificationChannel,
      });
    });
  });

  describe('POST /http_monitors/:httpMonitorId/claim', () => {
    it('claims unclaimed monitor', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const unclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: project.id,
        name: 'Unclaimed Monitor',
        url: 'https://example.com',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${unclaimedMonitor.id}/claim`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(201);

      const entity = await bootstrap.models.httpMonitorModel.findById(unclaimedMonitor.id);
      expect(entity?.claimed).toBe(true);
    });

    it('claims a monitor while the domain sits at the unclaimed monitor budget', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const unclaimedMonitors = await Promise.all(
        Array.from({ length: 3 }, (_, index) =>
          bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
            projectId: project.id,
            name: `Unclaimed monitor ${index}`,
            url: 'https://example.com',
          }),
        ),
      );

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${unclaimedMonitors[0].id}/claim`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(201);

      const entity = await bootstrap.models.httpMonitorModel.findById(unclaimedMonitors[0].id);
      expect(entity?.claimed).toBe(true);
    });

    it('treats claiming an already claimed monitor as done', async () => {
      // given
      const { token, cluster, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const maxMonitors = getUserPlanConfig(user.tier).httpMonitors.maxNumberOfMonitors;

      const claimedMonitors = await Promise.all(
        Array.from({ length: maxMonitors }, () =>
          bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
            clusterId: cluster.id,
            claimed: true,
          }),
        ),
      );

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${claimedMonitors[0].id}/claim`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(201);

      const entity = await bootstrap.models.httpMonitorModel.findById(claimedMonitors[0].id);
      expect(entity?.claimed).toBe(true);
    });

    it('throws error when the owner has reached the monitor limit', async () => {
      // given
      const { token, cluster, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const maxMonitors = getUserPlanConfig(user.tier).httpMonitors.maxNumberOfMonitors;

      for (let i = 0; i < maxMonitors; i++) {
        await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
          clusterId: cluster.id,
          claimed: true,
        });
      }

      const unclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        clusterId: cluster.id,
        name: 'Unclaimed Monitor',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${unclaimedMonitor.id}/claim`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(409);
      expect((response.body as ErrorResponse).message).toBe(
        'You have reached the maximum number of monitors on your plan',
      );

      // Verify monitor remains unclaimed
      const entity = await bootstrap.models.httpMonitorModel.findById(unclaimedMonitor.id);
      expect(entity?.claimed).toBe(false);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const unclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: setupA.project.id,
        name: 'Unclaimed Monitor',
        url: 'https://example.com',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/http_monitors/${unclaimedMonitor.id}/claim`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);

      // Verify monitor remains unclaimed
      const entity = await bootstrap.models.httpMonitorModel.findById(unclaimedMonitor.id);
      expect(entity?.claimed).toBe(false);
    });
  });
});
