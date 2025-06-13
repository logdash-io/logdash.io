import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { WebhookOptions } from '../../src/notification-channel/core/types/webhook-options.type';
import { NotificationTarget } from '../../src/notification-channel/core/enums/notification-target.enum';
import { getEnvConfig } from '../../src/shared/configs/env-configs';

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
          type: NotificationTarget.Telegram,
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
        expect(entity.target).toBe(NotificationTarget.Telegram);
        expect((entity.options as TelegramOptions).botToken).toBe('valid-bot-token');
        expect((entity.options as TelegramOptions).chatId).toBe('valid-chat-id');
      });

      it('uses default bot token if not provided', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const invalidTelegramData = {
          type: NotificationTarget.Telegram,
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
        expect(entity.target).toBe(NotificationTarget.Telegram);
        expect((entity.options as TelegramOptions).botToken).toBe(
          getEnvConfig().notificationChannels.telegramUptimeBot.token,
        );
      });
    });

    describe('Webhook', () => {
      it('creates webhook channel with valid data', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const webhookData = {
          type: NotificationTarget.Webhook,
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
        expect(entity.target).toBe(NotificationTarget.Webhook);
        expect((entity.options as WebhookOptions).url).toBe('https://example.com/webhook');
        expect((entity.options as WebhookOptions).headers).toEqual({
          'Content-Type': 'application/json',
        });
        expect((entity.options as WebhookOptions).method).toBe('POST');
      });

      it('rejects webhook channel with with missing url', async () => {
        // given
        const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

        const invalidWebhookData = {
          type: NotificationTarget.Webhook,
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
        type: NotificationTarget.Webhook,
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
  });
});
