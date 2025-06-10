import { INestApplication } from '@nestjs/common';
import { NotificationsChannelNormalized } from '../../src/notifications-channel/core/entities/notifications-channel.interface';
import { NotificationTarget } from '../../src/notifications-channel/core/enums/notification-target.enum';
import { TelegramOptions } from '../../src/notifications-channel/core/types/telegram-options.type';
import { WebhookOptions } from '../../src/notifications-channel/core/types/webhook-options.type';
import * as request from 'supertest';
import { CreateNotificationsChannelBody } from '../../src/notifications-channel/core/dto/create-notifications-channel.body';

export class NotificationsChannelUtils {
  constructor(private readonly app: INestApplication<any>) {}

  public async createTelegramNotificationsChannel(dto: {
    clusterId: string;
    token: string;
    options: TelegramOptions;
  }): Promise<NotificationsChannelNormalized> {
    const body: CreateNotificationsChannelBody = {
      type: NotificationTarget.Telegram,
      options: dto.options,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notifications_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body;
  }

  public async createWebhookNotificationsChannel(dto: {
    clusterId: string;
    token: string;
    options: WebhookOptions;
  }): Promise<NotificationsChannelNormalized> {
    const body: CreateNotificationsChannelBody = {
      type: NotificationTarget.Webhook,
      options: dto.options,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/clusters/${dto.clusterId}/notifications_channels`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body;
  }
}
