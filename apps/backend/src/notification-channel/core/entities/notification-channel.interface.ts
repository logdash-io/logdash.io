import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannelType } from '../enums/notification-target.enum';
import { NotificationChannelOptions } from './notification-channel.entity';

export interface NotificationChannelNormalized {
  id: string;
  clusterId: string;
  target: NotificationChannelType;
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

  @ApiProperty({ enum: NotificationChannelType })
  target: NotificationChannelType;

  @ApiProperty()
  name: string;

  @ApiProperty()
  options: NotificationChannelOptions;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
