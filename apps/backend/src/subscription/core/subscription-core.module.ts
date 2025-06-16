import { Module } from '@nestjs/common';
import { SubscriptionCoreController } from './subscription-core.controller';
import { SubscriptionReadModule } from '../read/subscription-read.module';

@Module({
  imports: [SubscriptionReadModule],
  controllers: [SubscriptionCoreController],
})
export class SubscriptionCoreModule {}
