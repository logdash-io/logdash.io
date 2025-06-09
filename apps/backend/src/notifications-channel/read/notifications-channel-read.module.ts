import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationsChannelEntity,
  NotificationsChannelSchema,
} from '../core/entities/notifications-channel.entity';
import { NotificationsChannelReadService } from './notifications-channel-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationsChannelEntity.name, schema: NotificationsChannelSchema },
    ]),
  ],
  providers: [NotificationsChannelReadService],
  exports: [NotificationsChannelReadService],
})
export class NotificationsChannelReadModule {}
