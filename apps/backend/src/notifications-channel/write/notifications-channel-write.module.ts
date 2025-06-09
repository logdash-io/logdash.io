import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationsChannelEntity,
  NotificationsChannelSchema,
} from '../core/entities/notifications-channel.entity';
import { NotificationsChannelWriteService } from './notifications-channel-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationsChannelEntity.name, schema: NotificationsChannelSchema },
    ]),
  ],
  providers: [NotificationsChannelWriteService],
  exports: [NotificationsChannelWriteService],
})
export class NotificationsChannelWriteModule {}
