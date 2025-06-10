import { Module } from '@nestjs/common';
import { NotificationChannelReadModule } from '../read/notification-channel-read.module';
import { NotificationChannelWriteModule } from '../write/notification-channel-write.module';
import { NotificationChannelCoreController } from './notification-channel-core.controller';
import { NotificationChannelMessagingModule } from '../messaging/notification-channel-messaging.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    NotificationChannelReadModule,
    NotificationChannelWriteModule,
    NotificationChannelMessagingModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [NotificationChannelCoreController],
  providers: [],
  exports: [],
})
export class NotificationChannelCoreModule {}
