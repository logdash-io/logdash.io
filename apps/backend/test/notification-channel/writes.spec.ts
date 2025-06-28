import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { WebhookOptions } from '../../src/notification-channel/core/types/webhook-options.type';
import { NotificationChannelType } from '../../src/notification-channel/core/enums/notification-target.enum';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { AuditLogEntityAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

describe('NotificationChannelCoreController (writes)', () => {
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

  describe('POST /clusters/:clusterId/notification_channels', () => {
    describe('Telegram', () => {
      it('creates telegram channel with valid data', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const telegramData = {
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: {
            botToken: 'valid-bot-token',
            chatId: 'valid-chat-id',
          },
        };

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/notification_channels`)
          .set('Authorization', `Bearer ${token}`)
          .send(telegramData);

        // then
        expect(response.status).toBe(201);
        const entity = (await bootstrap.models.notificationChannelModel.findOne())!;

        expect(entity).toBeDefined();
        expect(entity.clusterId).toBe(cluster.id);
        expect(entity.target).toBe(NotificationChannelType.Telegram);
        expect((entity.options as TelegramOptions).botToken).toBe('valid-bot-token');
        expect((entity.options as TelegramOptions).chatId).toBe('valid-chat-id');
      });

      it('uses default bot token if not provided', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const invalidTelegramData = {
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: {
            chatId: 'valid-chat-id',
          },
        };

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/notification_channels`)
          .set('Authorization', `Bearer ${token}`)
          .send(invalidTelegramData);

        // then
        expect(response.status).toBe(201);
        const entity = (await bootstrap.models.notificationChannelModel.findOne())!;

        expect(entity).toBeDefined();
        expect(entity.clusterId).toBe(cluster.id);
        expect(entity.target).toBe(NotificationChannelType.Telegram);
        expect((entity.options as TelegramOptions).botToken).toBe(
          getEnvConfig().notificationChannels.telegramUptimeBot.token,
        );
      });

      it('throws error if notification channel with same chatId already exists', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const telegramData = {
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: {
            botToken: 'valid-bot-token',
            chatId: 'valid-chat-id',
          },
        };

        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          options: { chatId: 'valid-chat-id' },
          token,
        });

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/notification_channels`)
          .set('Authorization', `Bearer ${token}`)
          .send(telegramData);

        // then
        expect(response.status).toBe(400);
        expect(response.body.message).toEqual('Channel with this chatId already exists');
      });

      it('sends welcome message to telegram channel', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const telegramData = {
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: { chatId: 'valid-chat-id' },
        };

        const requestBodies: any[] = [];

        bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
          botId: getEnvConfig().notificationChannels.telegramUptimeBot.token,
          onMessage: (body) => {
            requestBodies.push(body);
          },
        });

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/notification_channels`)
          .set('Authorization', `Bearer ${token}`)
          .send(telegramData);

        // then
        expect(response.status).toBe(201);
        expect(requestBodies.length).toBe(1);
        expect(requestBodies[0]).toEqual({
          chat_id: 'valid-chat-id',
          text: `👋 Hi\\! I'm \`logdash-uptime-bot\`
Setup was completed successfully

I'll notify you about the status of your services`,
        });
      });
    });

    describe('Webhook', () => {
      it('creates webhook channel with valid data', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'test@example.com',
          userTier: UserTier.Contributor,
        });

        const webhookData = {
          type: NotificationChannelType.Webhook,
          name: 'Test Webhook Channel',
          options: {
            url: 'https://example.com/webhook',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          },
        };

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/notification_channels`)
          .set('Authorization', `Bearer ${token}`)
          .send(webhookData);

        // then
        expect(response.status).toBe(201);
        const entity = (await bootstrap.models.notificationChannelModel.findOne())!;

        expect(entity).toBeDefined();
        expect(entity.clusterId).toBe(cluster.id);
        expect(entity.target).toBe(NotificationChannelType.Webhook);
        expect((entity.options as WebhookOptions).url).toBe('https://example.com/webhook');
        expect((entity.options as WebhookOptions).headers).toEqual({
          'Content-Type': 'application/json',
        });
        expect((entity.options as WebhookOptions).method).toBe('POST');
      });

      it('rejects webhook channel with with missing url', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupClaimed({
          email: 'test@example.com',
          userTier: UserTier.Contributor,
        });

        const invalidWebhookData = {
          type: NotificationChannelType.Webhook,
          name: 'Test Webhook Channel',
          options: {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          },
        };

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .post(`/clusters/${cluster.id}/notification_channels`)
          .set('Authorization', `Bearer ${token}`)
          .send(invalidWebhookData);

        // then
        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(['options.url must be a string']);
      });
    });

    it('forbids non-cluster member to create notification channel', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const notificationChannelData = {
        type: NotificationChannelType.Webhook,
        name: 'Test Webhook Channel',
        options: {
          url: 'https://example.com/webhook',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${setupA.cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${setupB.token}`)
        .send(notificationChannelData);

      // then
      expect(response.status).toBe(403);
    });

    it('creates audit log when notification channel is created', async () => {
      // given
      const { cluster, user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const telegramData = {
        type: NotificationChannelType.Telegram,
        name: 'Test Telegram Channel',
        options: {
          botToken: 'valid-bot-token',
          chatId: 'valid-chat-id',
        },
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`)
        .send(telegramData);

      // then
      expect(response.status).toBe(201);
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.NotificationChannel,
        relatedEntityId: response.body.id,
      });
    });

    it.each([
      {
        userTier: UserTier.Free,
        channelType: NotificationChannelType.Telegram,
        shouldSucceed: true,
        description: 'allows free users to create telegram channels',
      },
      {
        userTier: UserTier.Free,
        channelType: NotificationChannelType.Webhook,
        shouldSucceed: false,
        description: 'prevents free users from creating webhook channels',
      },
      {
        userTier: UserTier.Contributor,
        channelType: NotificationChannelType.Telegram,
        shouldSucceed: true,
        description: 'allows contributor users to create telegram channels',
      },
      {
        userTier: UserTier.Contributor,
        channelType: NotificationChannelType.Webhook,
        shouldSucceed: true,
        description: 'allows contributor users to create webhook channels',
      },
      {
        userTier: UserTier.EarlyBird,
        channelType: NotificationChannelType.Telegram,
        shouldSucceed: true,
        description: 'allows early bird users to create telegram channels',
      },
      {
        userTier: UserTier.EarlyBird,
        channelType: NotificationChannelType.Webhook,
        shouldSucceed: true,
        description: 'allows early bird users to create webhook channels',
      },
      {
        userTier: UserTier.Admin,
        channelType: NotificationChannelType.Telegram,
        shouldSucceed: true,
        description: 'allows admin users to create telegram channels',
      },
      {
        userTier: UserTier.Admin,
        channelType: NotificationChannelType.Webhook,
        shouldSucceed: true,
        description: 'allows admin users to create webhook channels',
      },
    ])('$description', async ({ userTier, channelType, shouldSucceed }) => {
      // given
      const setupMethod =
        userTier === UserTier.Free
          ? () => bootstrap.utils.generalUtils.setupAnonymous()
          : () =>
              bootstrap.utils.generalUtils.setupClaimed({
                email: `test-${userTier}@example.com`,
                userTier,
              });

      const { cluster, token } = await setupMethod();

      const channelData = {
        type: channelType,
        name: `Test ${channelType} Channel`,
        options:
          channelType === NotificationChannelType.Telegram
            ? { chatId: `test-chat-${Date.now()}` }
            : { url: 'https://example.com/webhook' },
      };

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`)
        .send(channelData);

      // then
      if (shouldSucceed) {
        expect(response.status).toBe(201);
        expect(response.body.target).toBe(channelType);
      } else {
        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          `${channelType} notification channels are not available for your current tier`,
        );
      }
    });

    it('does not allow to create more than 100 notification channels', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await Promise.all(
        Array.from({ length: 100 }).map((_, i) =>
          bootstrap.models.notificationChannelModel.create({
            clusterId: cluster.id,
          }),
        ),
      );

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: { chatId: 'valid-chat-id' },
        });

      // then
      expect(response.status).toBe(400);
      expect(response.body.message).toEqual('Cannot create more than 100 notification channels');
    }, 10_000);
  });

  describe('PUT /notification_channels/:id', () => {
    it('updates notification channel options', async () => {
      // given
      const { cluster, user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a notification channel first
      const channel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          options: { chatId: 'some-chat' },
          token,
        });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/notification_channels/${channel.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          options: {
            botToken: 'updated-bot-token',
            chatId: 'updated-chat-id',
          },
        });

      // then
      expect(response.status).toBe(200);
      const entity = await bootstrap.models.notificationChannelModel.findById(channel.id);
      expect((entity!.options as TelegramOptions).botToken).toBe('updated-bot-token');
      expect((entity!.options as TelegramOptions).chatId).toBe('updated-chat-id');
    });

    it('creates audit log when notification channel is updated', async () => {
      // given
      const { cluster, user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a notification channel first
      const createResponse = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: {
            botToken: 'original-bot-token',
            chatId: 'original-chat-id',
          },
        });

      const channelId = createResponse.body.id;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/notification_channels/${channelId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          options: {
            botToken: 'updated-bot-token',
            chatId: 'updated-chat-id',
          },
        });

      // then
      expect(response.status).toBe(200);
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Update,
        relatedDomain: RelatedDomain.NotificationChannel,
        relatedEntityId: channelId,
      });
    });
  });

  describe('DELETE /notification_channels/:id', () => {
    it('deletes notification channel', async () => {
      // given
      const { cluster, user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a notification channel first
      const createResponse = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: {
            botToken: 'bot-token',
            chatId: 'chat-id',
          },
        });

      const channelId = createResponse.body.id;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/notification_channels/${channelId}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      const entity = await bootstrap.models.notificationChannelModel.findById(channelId);
      expect(entity).toBeNull();
    });

    it('creates audit log when notification channel is deleted', async () => {
      // given
      const { cluster, user, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a notification channel first
      const createResponse = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: NotificationChannelType.Telegram,
          name: 'Test Telegram Channel',
          options: {
            botToken: 'bot-token',
            chatId: 'chat-id',
          },
        });

      const channelId = createResponse.body.id;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/notification_channels/${channelId}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Delete,
        relatedDomain: RelatedDomain.NotificationChannel,
        relatedEntityId: channelId,
      });
    });
  });
});
