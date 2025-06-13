import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationChannelEntity,
  NotificationChannelSchema,
} from '../core/entities/notification-channel.entity';
import { NotificationChannelWriteService } from './notification-channel-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationChannelEntity.name, schema: NotificationChannelSchema },
    ]),
  ],
  providers: [NotificationChannelWriteService],
  exports: [NotificationChannelWriteService],
})
export class NotificationChannelWriteModule {}
