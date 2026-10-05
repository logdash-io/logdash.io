import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { NotificationChannelSerialized } from '../../src/notification-channel/core/entities/notification-channel.interface';
import { NotificationChannelType } from '../../src/notification-channel/core/enums/notification-target.enum';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { WebhookOptions } from '../../src/notification-channel/core/types/webhook-options.type';
import request from 'supertest';
import { randomBytes } from 'crypto';
import { CreateNotificationChannelBody } from '../../src/notification-channel/core/dto/create-notification-channel.body';
import { getEnvConfig } from '../../src/shared/configs/env-configs';

export class NotificationChannelUtils {
  constructor(private readonly app: INestApplication<App>) {}

  public async createTelegramNotificationChannel(dto: {
    clusterId: string;
    token: string;
    options?: Partial<TelegramOptions>;
    name?: string;
  }): Promise<NotificationChannelSerialized> {
    const options = dto.options || {};

    // Deliberately no botToken default: `botToken` now has to look like a real
    // telegram token (`<bot id>:<secret>`), and omitting it is how a channel
    // opts into the built-in uptime bot - the server fills it in after
    // validation, exactly like it does in production.

    if (!options.chatId) {
      options.chatId = 'some-chat-id';
    }

    if (!options.botToken) {
      await this.linkTelegramChat({ token: dto.token, chatId: options.chatId });
    }

    const body: CreateNotificationChannelBody = {
      type: NotificationChannelType.Telegram,
      name: dto.name || 'Test Telegram Channel',
      options: options as TelegramOptions,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notification_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body as NotificationChannelSerialized;
  }

  /**
   * Proves a chat the way a real user does: the bot receives the setup
   * passphrase in that chat, then the user reads it back through chat_info.
   * The built-in bot only accepts chats linked like this.
   */
  public async linkTelegramChat(dto: { token: string; chatId: string }): Promise<void> {
    const passphrase = `/test_chat_${randomBytes(8).toString('hex')}`;

    await request(this.app.getHttpServer())
      .post('/notification_channel_setup/telegram/bot_webhook')
      .set(
        'X-Telegram-Bot-Api-Secret-Token',
        getEnvConfig().notificationChannels.telegramUptimeBot.secret,
      )
      .send({
        update_id: 1,
        message: {
          message_id: 1,
          from: { id: 1, is_bot: false, first_name: 'Test' },
          chat: { id: dto.chatId, type: 'private', first_name: 'Test' },
          date: Math.floor(Date.now() / 1000),
          text: passphrase,
        },
      })
      .expect(201);

    await request(this.app.getHttpServer())
      .get('/notification_channel_setup/telegram/chat_info')
      .set('Authorization', `Bearer ${dto.token}`)
      .query({ passphrase })
      .expect(200, { success: true, chatId: dto.chatId, name: 'Test' });
  }

  public async createWebhookNotificationChannel(dto: {
    clusterId: string;
    token: string;
    options: WebhookOptions;
    name?: string;
  }): Promise<NotificationChannelSerialized> {
    const body: CreateNotificationChannelBody = {
      type: NotificationChannelType.Webhook,
      name: dto.name || 'Test Webhook Channel',
      options: dto.options,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notification_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body as NotificationChannelSerialized;
  }

  public async createEmailNotificationChannel(dto: {
    clusterId: string;
    token: string;
    email: string;
  }): Promise<request.Response> {
    const body: CreateNotificationChannelBody = {
      type: NotificationChannelType.Email,
      name: dto.email,
      options: { email: dto.email },
    };

    return request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notification_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);
  }
}
