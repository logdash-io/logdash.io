import { Injectable } from '@nestjs/common';
import { UserWriteService } from '../../user/write/user-write.service';
import { UserReadService } from '../../user/read/user-read.service';
import Stripe from 'stripe';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { Logger } from '@logdash/js-sdk';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';

@Injectable()
export class StripePaymentSucceededHandler {
  constructor(
    private readonly logger: Logger,
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly subscriptionManagementService: SubscriptionManagementService,
  ) {}

  public async handle(event: Stripe.Event): Promise<void> {
    this.logger.log(`[STRIPE] Handling payment succeeded event`, {
      event,
    });

    if (!this.eventIsValid(event)) {
      console.log('Event is invalid');
      return;
    }

    const priceId = event.data.object.lines.data[0].price?.id;
    const customerId = event.data.object.customer;
    const email = event.data.object.customer_email;

    if (priceId !== getEnvConfig().stripe.earlyBirdPriceId) {
      this.logger.error(`[STRIPE] Unknown product for user`, {
        email,
        priceId,
        customerId,
      });
      return;
    }

    if (!email) {
      this.logger.error(`[STRIPE] Invoice payment succeeded but no customer email found`, {
        event,
      });
      return;
    }

    const user = await this.userReadService.readByEmail(email);

    if (!user) {
      this.logger.error(`[STRIPE] User not found`, { email });
      return;
    }

    await this.userWriteService.update({
      stripeCustomerId: customerId as string,
      id: user.id,
    });

    await this.subscriptionManagementService.tryApplyNewSubscription({
      userId: user.id,
      tier: UserTier.EarlyBird,
      endsAt: null,
    });

    this.logger.log(`[STRIPE] Finished handling payment succeeded event`);
  }

  private eventIsValid(event: Stripe.Event): event is Stripe.InvoicePaymentSucceededEvent {
    if (event.type !== 'invoice.payment_succeeded') {
      this.logger.error(`[STRIPE] Invalid event type for payment succeeded handler`, {
        event,
      });
      console.log(1);
      return false;
    }

    if (!event.data.object.lines.data[0].price) {
      this.logger.error(`[STRIPE] Price is missing`, {
        event,
      });
      console.log(2);

      return false;
    }

    if (!event.data.object.customer_email) {
      this.logger.error(`[STRIPE] Customer email is missing`, {
        event,
      });
      console.log(3);

      return false;
    }

    if (!event.data.object.customer || typeof event.data.object.customer !== 'string') {
      this.logger.error(`[STRIPE] Customer is missing or not a string`, {
        event,
      });
      console.log(4);

      return false;
    }

    return true;
  }
}
