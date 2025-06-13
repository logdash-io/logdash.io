import { INestApplication } from '@nestjs/common';
import { NotificationChannelNormalized } from '../../src/notification-channel/core/entities/notification-channel.interface';
import { NotificationTarget } from '../../src/notification-channel/core/enums/notification-target.enum';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { WebhookOptions } from '../../src/notification-channel/core/types/webhook-options.type';
import * as request from 'supertest';
import { CreateNotificationChannelBody } from '../../src/notification-channel/core/dto/create-notification-channel.body';

export class NotificationChannelUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createTelegramNotificationChannel(dto: {
    clusterId: string;
    token: string;
    options: TelegramOptions;
  }): Promise<NotificationChannelNormalized> {
    const body: CreateNotificationChannelBody = {
      type: NotificationTarget.Telegram,
      options: dto.options,
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
  }): Promise<NotificationChannelNormalized> {
    const body: CreateNotificationChannelBody = {
      type: NotificationTarget.Webhook,
      options: dto.options,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notification_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body;
  }
}
