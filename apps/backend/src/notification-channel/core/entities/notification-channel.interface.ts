import { ApiProperty } from '@nestjs/swagger';
import { NotificationTarget } from '../enums/notification-target.enum';
import { TelegramOptions } from '../types/telegram-options.type';
import { WebhookOptions } from '../types/webhook-options.type';
import { NotificationChannelOptions } from './notification-channel.entity';

export interface NotificationChannelNormalized {
  id: string;
  clusterId: string;
  target: NotificationTarget;
  options: NotificationChannelOptions;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationChannelSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clusterId: string;

  @ApiProperty({ enum: NotificationTarget })
  target: NotificationTarget;

  @ApiProperty()
  options: NotificationChannelOptions;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
