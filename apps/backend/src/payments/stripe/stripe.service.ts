import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserReadService } from '../../user/read/user-read.service';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Logger } from '@logdash/js-sdk';
import { paidTiers, UserTier } from '../../user/core/enum/user-tier.enum';
import { mapTierToPriceId } from './stripe-mapper';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';
import { StripeEventEmitter, StripeEvents } from './stripe-event.emitter';

@Injectable()
export class StripeService {
  constructor(
    private readonly logger: Logger,
    private readonly userReadService: UserReadService,
    private readonly stripe: Stripe,
    private readonly subscriptionManagementService: SubscriptionManagementService,
    private readonly stripeEventsEmitter: StripeEventEmitter,
  ) {}

  public async changePaidPlan(userId: string, tier: UserTier): Promise<void> {
    this.logger.log(`[STRIPE] Initiating plan upgrade from paid to paid`, { userId, tier });

    const user = await this.userReadService.readByIdOrThrow(userId);

    if (!user) {
      this.logger.error(`[STRIPE] User not found with id`, { userId });
      throw new Error(`User not found with id: ${userId}`);
    }

    if (user.tier === tier) {
      this.logger.error(`[STRIPE] User already has tier`, { userId, tier });
      throw new Error(`User already has tier: ${tier}`);
    }

    if (!paidTiers.includes(user.tier)) {
      this.logger.error(`[STRIPE] User is not a paid tier`, { userId, tier });
      throw new Error(`User is not a paid tier: ${user.tier}`);
    }

    if (!user.stripeCustomerId) {
      this.logger.error(`[STRIPE] User has no stripe customer id`, { userId });
      throw new Error(`User has no stripe customer id`);
    }

    const subscription = await this.getActiveSubscription(user.stripeCustomerId);

    const update = await this.stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: mapTierToPriceId(tier),
        },
      ],
      proration_behavior: 'create_prorations',
    });

    if (!update) {
      this.logger.error(`[STRIPE] Failed to update subscription`, {
        userId,
        update: JSON.stringify(update),
      });
      throw new Error(`Failed to update subscription`);
    }

    await this.subscriptionManagementService.changePaidPlan(userId, user.stripeCustomerId, tier);

    await this.stripeEventsEmitter.emitPaymentSucceeded({
      email: user.email,
      tier,
    });
  }

  private async getActiveSubscription(stripeCustomerId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscription.data.length === 0) {
      this.logger.error(`[STRIPE] User has no active subscription`, { stripeCustomerId });
      throw new Error(`User has no active subscription`);
    }

    return subscription.data[0];
  }

  public async getCustomerPortalUrl(userId: string): Promise<string> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    if (!user) {
      this.logger.error(`[STRIPE] User not found with id`, { userId });
      throw new Error(`User not found with id: ${userId}`);
    }

    if (!user.stripeCustomerId) {
      this.logger.error(`[STRIPE] User with id has no stripe customer id`, { userId });
      throw new Error(`User with id: ${userId} has no stripe customer id`);
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: getEnvConfig().stripe.returnFromBillingUrl,
    });

    return session.url;
  }
}
