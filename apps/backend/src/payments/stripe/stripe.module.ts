import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UserWriteModule } from '../../user/write/user-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserTierModule } from '../../user/tier/user-tier.module';
import { StripeEventsHandler } from './stripe.events-handler';
import { StripePaymentSucceededHandler } from './stripe.payment-succeeded.handler';
import { StripeSubscriptionDeletedHandler } from './stripe.subscription-deleted.handler';
import Stripe from 'stripe';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { SubscriptionManagementModule } from '../../subscription/management/subscription-management.module';

@Module({
  imports: [UserWriteModule, UserReadModule, UserTierModule, SubscriptionManagementModule],
  providers: [
    StripeService,
    StripeEventsHandler,
    StripePaymentSucceededHandler,
    StripeSubscriptionDeletedHandler,
    {
      provide: Stripe,
      useFactory: () => new Stripe(getEnvConfig().stripe.apiKeySecret),
    },
  ],
  controllers: [StripeController],
})
export class StripeModule {}
