import { Module } from '@nestjs/common';
import { NotificationsChannelReadModule } from '../read/notifications-channel-read.module';
import { NotificationsChannelWriteModule } from '../write/notifications-channel-write.module';
import { NotificationsChannelCoreController } from './notifications-channel-core.controller';
import { NotificationsChannelMessagingModule } from '../messaging/notifications-channel-messaging.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    NotificationsChannelReadModule,
    NotificationsChannelWriteModule,
    NotificationsChannelMessagingModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [NotificationsChannelCoreController],
  providers: [],
  exports: [],
})
export class NotificationsChannelCoreModule {}
