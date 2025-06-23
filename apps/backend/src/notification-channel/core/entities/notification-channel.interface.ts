import { ApiProperty } from '@nestjs/swagger';
import { NotificationTarget } from '../enums/notification-target.enum';
import { NotificationChannelOptions } from './notification-channel.entity';

export interface NotificationChannelNormalized {
  id: string;
  clusterId: string;
  target: NotificationTarget;
  name: string;
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
  name: string;

  @ApiProperty()
  options: NotificationChannelOptions;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
