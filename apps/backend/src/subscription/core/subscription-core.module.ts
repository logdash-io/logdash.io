import { Module } from '@nestjs/common';
import { SubscriptionCoreController } from './subscription-core.controller';
import { SubscriptionReadModule } from '../read/subscription-read.module';
import { SubscriptionManagementModule } from '../management/subscription-management.module';
import { SubscriptionTempService } from './subscription-temp.service';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserTierModule } from '../../user/tier/user-tier.module';

@Module({
  imports: [SubscriptionReadModule, SubscriptionManagementModule, UserReadModule, UserTierModule],
  providers: [SubscriptionTempService],
  controllers: [SubscriptionCoreController],
})
export class SubscriptionCoreModule {}
