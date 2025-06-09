import { ApiProperty } from '@nestjs/swagger';
import { NotificationTarget } from '../enums/notification-target.enum';
import { TelegramOptions } from '../types/telegram-options.type';
import { WebhookOptions } from '../types/webhook-options.type';

export interface NotificationsChannelNormalized {
  id: string;
  clusterId: string;
  target: NotificationTarget;
  options: TelegramOptions | WebhookOptions;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationsChannelSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ enum: NotificationTarget })
  target: NotificationTarget;

  @ApiProperty()
  options: TelegramOptions | WebhookOptions;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
