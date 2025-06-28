import { INestApplication } from '@nestjs/common';
import { NotificationChannelNormalized } from '../../src/notification-channel/core/entities/notification-channel.interface';
import { NotificationChannelType } from '../../src/notification-channel/core/enums/notification-target.enum';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { WebhookOptions } from '../../src/notification-channel/core/types/webhook-options.type';
import * as request from 'supertest';
import { CreateNotificationChannelBody } from '../../src/notification-channel/core/dto/create-notification-channel.body';
import { getEnvConfig } from '../../src/shared/configs/env-configs';

export class NotificationChannelUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createTelegramNotificationChannel(dto: {
    clusterId: string;
    token: string;
    options?: Partial<TelegramOptions>;
    name?: string;
  }): Promise<NotificationChannelNormalized> {
    const options = dto.options || {};

    if (!options.botToken) {
      options.botToken = getEnvConfig().notificationChannels.telegramUptimeBot.token;
    }

    if (!options.chatId) {
      options.chatId = 'some-chat-id';
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

    return response.body;
  }

  public async createWebhookNotificationChannel(dto: {
    clusterId: string;
    token: string;
    options: WebhookOptions;
    name?: string;
  }): Promise<NotificationChannelNormalized> {
    const body: CreateNotificationChannelBody = {
      type: NotificationChannelType.Webhook,
      name: dto.name || 'Test Webhook Channel',
      options: dto.options,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notification_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body;
  }
}
