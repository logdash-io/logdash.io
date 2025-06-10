import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationChannelEntity,
  NotificationChannelSchema,
} from '../core/entities/notification-channel.entity';
import { NotificationChannelReadService } from './notification-channel-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationChannelEntity.name, schema: NotificationChannelSchema },
    ]),
  ],
  providers: [NotificationChannelReadService],
  exports: [NotificationChannelReadService],
})
export class NotificationChannelReadModule {}
