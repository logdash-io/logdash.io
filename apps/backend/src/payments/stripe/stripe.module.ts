import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UserWriteModule } from '../../user/write/user-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserTierModule } from '../../user/tier/user-tier.module';
import { StripeEventsHandler } from './stripe.events-handler';
import { StripePaymentSucceededHandler } from './stripe.payment-succeeded.handler';
import { StripeSubscriptionDeletedHandler } from './stripe.subscription-deleted.handler';

@Module({
  imports: [UserWriteModule, UserReadModule, UserTierModule],
  providers: [
    StripeService,
    StripeEventsHandler,
    StripePaymentSucceededHandler,
    StripeSubscriptionDeletedHandler,
  ],
  controllers: [StripeController],
})
export class StripeModule {}
