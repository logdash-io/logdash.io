import { Module } from '@nestjs/common';
import { SubscriptionCoreController } from './subscription-core.controller';
import { SubscriptionReadModule } from '../read/subscription-read.module';
import { SubscriptionManagementModule } from '../management/subscription-management.module';

@Module({
  imports: [SubscriptionReadModule, SubscriptionManagementModule],
  controllers: [SubscriptionCoreController],
})
export class SubscriptionCoreModule {}
