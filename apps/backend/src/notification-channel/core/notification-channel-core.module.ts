import { Module } from '@nestjs/common';
import { NotificationChannelReadModule } from '../read/notification-channel-read.module';
import { NotificationChannelWriteModule } from '../write/notification-channel-write.module';
import { NotificationChannelCoreController } from './notification-channel-core.controller';
import { NotificationChannelMessagingModule } from '../messaging/notification-channel-messaging.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { TelegramSetupModule } from '../setup/telegram/telegram-setup.module';
import { NotificationChannelOptionsEnrichmentService } from './notification-channel-options-enrichment.service';
import { NotificationChannelOptionsValidationService } from './notification-channel-options-validation.service';
import { UserReadModule } from '../../user/read/user-read.module';
import { NotificationChannelTierValidationService } from './notification-channel-tier-validation.service';

@Module({
  imports: [
    NotificationChannelReadModule,
    NotificationChannelWriteModule,
    NotificationChannelMessagingModule,
    TelegramSetupModule,
    UserReadModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [NotificationChannelCoreController],
  providers: [
    NotificationChannelOptionsEnrichmentService,
    NotificationChannelOptionsValidationService,
    NotificationChannelTierValidationService,
  ],
  exports: [],
})
export class NotificationChannelCoreModule {}
