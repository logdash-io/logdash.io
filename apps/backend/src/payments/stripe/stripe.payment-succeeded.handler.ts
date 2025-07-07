import { Injectable } from '@nestjs/common';
import { UserWriteService } from '../../user/write/user-write.service';
import { UserReadService } from '../../user/read/user-read.service';
import Stripe from 'stripe';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { Logger } from '@logdash/js-sdk';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';
import { StripeEventEmitter } from './stripe-event.emitter';

@Injectable()
export class StripePaymentSucceededHandler {
  constructor(
    private readonly logger: Logger,
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
        this.logger.error(`[STRIPE] Unknown price id: ${priceId}`);
        throw new Error(`Unknown price id: ${priceId}`);
    }
  }

  public async handle(event: Stripe.Event): Promise<void> {
    this.logger.log(`[STRIPE] Handling payment succeeded event`, {
      event,
    });

    if (!this.eventIsValid(event)) {
      return;
    }

    const priceId = event.data.object.lines.data[0].price?.id;
    const customerId = event.data.object.customer;
    const email = event.data.object.customer_email;

    if (!priceId) {
      this.logger.error(`[STRIPE] Price id is missing`, {
        event,
      });
      return;
    }

    const tier = await this.mapPriceIdToTier(priceId);

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

    await this.subscriptionManagementService.applyNew({
      userId: user.id,
      tier,
      endsAt: null,
    });

    await this.stripeEventEmitter.emitPaymentSucceeded({
      email,
      tier,
    });

    this.logger.log(`[STRIPE] Finished handling payment succeeded event`);
  }

  private eventIsValid(event: Stripe.Event): event is Stripe.InvoicePaymentSucceededEvent {
    if (event.type !== 'invoice.payment_succeeded') {
      this.logger.error(`[STRIPE] Invalid event type for payment succeeded handler`, {
        event,
      });
      return false;
    }

    if (!event.data.object.lines.data[0].price) {
      this.logger.error(`[STRIPE] Price is missing`, {
        event,
      });

      return false;
    }

    if (!event.data.object.customer_email) {
      this.logger.error(`[STRIPE] Customer email is missing`, {
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
