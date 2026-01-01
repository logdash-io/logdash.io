import { Inject, Injectable } from '@nestjs/common';
import { UserWriteService } from '../../user/write/user-write.service';
import { UserReadService } from '../../user/read/user-read.service';
import Stripe from 'stripe';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STRIPE_LOGGER } from '../../shared/logdash/logdash-tokens';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';
import { StripeEventEmitter } from './stripe-event.emitter';

@Injectable()
export class StripePaymentSucceededHandler {
  constructor(
    @Inject(STRIPE_LOGGER) private readonly logger: LogdashLogger,
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly subscriptionManagementService: SubscriptionManagementService,
    private readonly stripeEventEmitter: StripeEventEmitter,
  ) {}

  private async mapPriceIdToTier(priceId: string): Promise<UserTier> {
    switch (priceId) {
      case getEnvConfig().stripe.earlyBirdPriceId:
        return UserTier.EarlyBird;
      case getEnvConfig().stripe.builderPriceId:
        return UserTier.Builder;
      case getEnvConfig().stripe.proPriceId:
        return UserTier.Pro;
      default:
        this.logger.error(`Unknown price id: ${priceId}`);
        throw new Error(`Unknown price id: ${priceId}`);
    }
  }

  public async handle(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling payment succeeded event`, {
      event,
    });

    if (!this.eventIsValid(event)) {
      return;
    }

    const price = event.data.object.lines.data[0].pricing?.price_details?.price;
    const priceId = typeof price === 'string' ? price : price?.id;
    const customerId = event.data.object.customer;
    const email = event.data.object.customer_email;

    if (!priceId) {
      this.logger.error(`Price id is missing`, {
        event,
      });
      return;
    }

    const tier = await this.mapPriceIdToTier(priceId);

    if (!email) {
      this.logger.error(`Invoice payment succeeded but no customer email found`, {
        event,
      });
      return;
    }

    const user = await this.userReadService.readByEmail(email);

    if (!user) {
      this.logger.error(`User not found`, { email });
      return;
    }

    try {
      await this.userWriteService.update({
        stripeCustomerId: customerId as string,
        id: user.id,
      });
    } catch (error) {
      this.logger.error(`Failed to update user with stripe customer id`, {
        userId: user.id,
        stripeCustomerId: customerId,
        error,
      });
      throw error;
    }

    this.logger.log(`Updated user with stripe customer id`, {
      userId: user.id,
      stripeCustomerId: customerId,
    });

    try {
      await this.subscriptionManagementService.applyNew({
        userId: user.id,
        tier,
        endsAt: null,
      });
    } catch (error) {
      this.logger.error(`Failed to apply new subscription`, {
        userId: user.id,
        tier,
        error,
      });
      throw error;
    }

    this.logger.log(`Applied new subscription`, {
      userId: user.id,
      tier,
    });

    try {
      await this.stripeEventEmitter.emitPaymentSucceeded({
        email,
        tier,
      });
    } catch (error) {
      this.logger.error(`Failed to emit payment succeeded event`, {
        email,
        tier,
        error,
      });
      throw error;
    }

    this.logger.log(`Finished handling payment succeeded event`, {
      userId: user.id,
      email,
      tier,
    });
  }

  private eventIsValid(event: Stripe.Event): event is Stripe.InvoicePaymentSucceededEvent {
    if (event.type !== 'invoice.payment_succeeded') {
      this.logger.error(`Invalid event type for payment succeeded handler`, {
        event,
      });
      return false;
    }

    if (!event.data.object.lines.data[0].pricing?.price_details?.price) {
      this.logger.error(`Price is missing`, {
        event,
      });

      return false;
    }

    if (!event.data.object.customer_email) {
      this.logger.error(`Customer email is missing`, {
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
