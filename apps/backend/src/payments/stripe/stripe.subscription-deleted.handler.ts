import { Inject, Injectable } from '@nestjs/common';
import { UserReadService } from '../../user/read/user-read.service';
import Stripe from 'stripe';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STRIPE_LOGGER } from '../../shared/logdash/logdash-tokens';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';
import { StripeEventEmitter } from './stripe-event.emitter';

@Injectable()
export class StripeSubscriptionDeletedHandler {
  constructor(
    @Inject(STRIPE_LOGGER) private readonly logger: LogdashLogger,
    private readonly userReadService: UserReadService,
    private readonly subscriptionManagementService: SubscriptionManagementService,
    private readonly stripeEventEmitter: StripeEventEmitter,
  ) {}

  public async handle(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling subscription deleted event`, {
      event,
    });

    if (!this.eventIsValid(event)) {
      return;
    }

    const stripeCustomerId = event.data.object.customer;

    const user = await this.userReadService.readByStripeCustomerId(stripeCustomerId as string);

    if (!user) {
      this.logger.error(`User not found`, { stripeCustomerId, event });
      return;
    }

    try {
      await this.subscriptionManagementService.endActiveSubscription(
        user.id,
        stripeCustomerId as string,
      );
    } catch (error) {
      this.logger.error(`Failed to end active subscription`, {
        userId: user.id,
        stripeCustomerId,
        error,
      });
      throw error;
    }

    this.logger.log(`Finished handling subscription deleted event`, {
      userId: user.id,
      stripeCustomerId,
    });

    try {
      await this.stripeEventEmitter.emitSubscriptionDeleted({
        email: user.email,
      });
    } catch (error) {
      this.logger.error(`Failed to emit subscription deleted event`, {
        email: user.email,
        error,
      });
      throw error;
    }
  }

  private eventIsValid(event: Stripe.Event): event is Stripe.CustomerSubscriptionDeletedEvent {
    if (event.type !== 'customer.subscription.deleted') {
      this.logger.error(`Invalid event type for subscription deleted handler`, {
        event,
      });
      return false;
    }

    if (!event.data.object.customer || typeof event.data.object.customer !== 'string') {
      this.logger.error(`Customer is missing or not a string`, {
        event,
      });
      return false;
    }

    return true;
  }
}
