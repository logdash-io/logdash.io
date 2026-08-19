import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from '../utils/bootstrap';
import { NotificationChannelSerialized } from '../../src/notification-channel/core/entities/notification-channel.interface';

describe('NotificationChannelCoreController (reads)', () => {
  let app: INestApplication<App>;
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();

    app = bootstrap.app;
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    bootstrap.utils.telegramUtils.suppressWelcomeMessages();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /clusters/:clusterId/notification_channels', () => {
    it('reads projects in cluster', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const customNotificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          token,
          options: {
            botToken: '123456:valid-bot-token',
            chatId: 'valid-chat-id-1',
          },
        });

      const builtInNotificationChannel =
        await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
          clusterId: cluster.id,
          token,
          // no botToken -> the server enriches the channel with the built-in
          // uptime bot token, which the serializer must then hide again
          options: {
            chatId: 'valid-chat-id-2',
          },
        });

      // when
      const response = await request(app.getHttpServer())
        .get(`/clusters/${cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const notificationChannels = response.body as NotificationChannelSerialized[];

      expect(notificationChannels).toHaveLength(2);

      const customNotificationChannelResponse = notificationChannels.find(
        (channel) => channel.id === customNotificationChannel.id,
      )!;

      expect(customNotificationChannelResponse.options).toEqual({
        botToken: '123456:valid-bot-token',
        chatId: 'valid-chat-id-1',
      });

      const builtInNotificationChannelResponse = notificationChannels.find(
        (channel) => channel.id === builtInNotificationChannel.id,
      )!;

      expect(builtInNotificationChannelResponse.options).toEqual({
        botToken: undefined,
        chatId: 'valid-chat-id-2',
      });
    });

    it('returns 403 when user is not a cluster member', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/notification_channels`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });
  });
});
