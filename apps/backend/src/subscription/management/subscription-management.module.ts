import { Module } from '@nestjs/common';
import { SubscriptionManagementService } from './subscription-management.service';
import { SubscriptionReadModule } from '../read/subscription-read.module';
import { SubscriptionWriteModule } from '../write/subscription-write.module';
import { UserTierModule } from '../../user/tier/user-tier.module';

@Module({
  imports: [SubscriptionReadModule, SubscriptionWriteModule, UserTierModule],
  providers: [SubscriptionManagementService],
  exports: [SubscriptionManagementService],
})
export class SubscriptionManagementModule {}
