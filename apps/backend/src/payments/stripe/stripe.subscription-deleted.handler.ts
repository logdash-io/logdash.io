import { Injectable } from '@nestjs/common';
import { UserTierService } from '../../user/tier/user-tier.service';
import { UserReadService } from '../../user/read/user-read.service';
import Stripe from 'stripe';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { Logger } from '@logdash/js-sdk';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';

@Injectable()
export class StripeSubscriptionDeletedHandler {
  constructor(
    private readonly logger: Logger,
    private readonly userReadService: UserReadService,
    private readonly userTierService: UserTierService,
    private readonly subscriptionManagementService: SubscriptionManagementService,
  ) {}

  public async handle(event: Stripe.Event): Promise<void> {
    this.logger.log(`[STRIPE] Handling subscription deleted event`, {
      event,
    });

    if (!this.eventIsValid(event)) {
      return;
    }

    const stripeCustomerId = event.data.object.customer;

    const user = await this.userReadService.readByStripeCustomerId(stripeCustomerId as string);

    if (!user) {
      this.logger.error(`[STRIPE] User not found`, { stripeCustomerId, event });
      return;
    }

    await this.subscriptionManagementService.endActiveSubscription(
      user.id,
      stripeCustomerId as string,
    );

    this.logger.log(`[STRIPE] Finished handling subscription deleted event`);
  }

  private eventIsValid(event: Stripe.Event): event is Stripe.CustomerSubscriptionDeletedEvent {
    if (event.type !== 'customer.subscription.deleted') {
      this.logger.error(`[STRIPE] Invalid event type for subscription deleted handler`, {
        event,
      });
      return false;
    }

    if (!event.data.object.customer || typeof event.data.object.customer !== 'string') {
      this.logger.error(`[STRIPE] Customer is missing or not a string`, {
        event,
      });
      return false;
    }

    return true;
  }
}
