import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { UserReadService } from '../../user/read/user-read.service';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STRIPE_LOGGER } from '../../shared/logdash/logdash-tokens';
import { paidTiers, UserTier } from '../../user/core/enum/user-tier.enum';
import { mapTierToPriceId } from './stripe-mapper';
import { SubscriptionManagementService } from '../../subscription/management/subscription-management.service';
import { StripeEventEmitter } from './stripe-event.emitter';

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_LOGGER) private readonly logger: LogdashLogger,
    private readonly userReadService: UserReadService,
    private readonly stripe: Stripe,
    private readonly subscriptionManagementService: SubscriptionManagementService,
    private readonly stripeEventsEmitter: StripeEventEmitter,
  ) {}

  public async changePaidPlan(userId: string, tier: UserTier): Promise<void> {
    this.logger.log(`Initiating plan upgrade from paid to paid`, { userId, tier });

    const user = await this.userReadService.readByIdOrThrow(userId);

    if (user.tier === tier) {
      this.logger.warn(`User already has tier`, { userId, tier });
      throw new ConflictException('You are already on this plan');
    }

    if (!paidTiers.includes(user.tier)) {
      this.logger.warn(`User is not a paid tier`, { userId, tier });
      throw new BadRequestException('Subscribe through checkout to start a paid plan');
    }

    if (!user.stripeCustomerId) {
      this.logger.warn(`User has no stripe customer id`, { userId });
      throw new ConflictException('You have no active subscription to change');
    }

    const subscription = await this.getActiveSubscription(user.stripeCustomerId);

    let update: Stripe.Subscription;

    try {
      update = await this.stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: mapTierToPriceId(tier),
          },
        ],
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      this.logger.error(`Failed to update subscription in Stripe`, {
        userId,
        subscriptionId: subscription.id,
        error,
      });
      throw error;
    }

    if (!update) {
      this.logger.error(`Failed to update subscription`, {
        userId,
        update: JSON.stringify(update),
      });
      throw new Error(`Failed to update subscription`);
    }

    try {
      await this.subscriptionManagementService.changePaidPlan(userId, user.stripeCustomerId, tier);
    } catch (error) {
      this.logger.error(`Failed to change paid plan in subscription management`, {
        userId,
        tier,
        error,
      });
      throw error;
    }

    try {
      this.stripeEventsEmitter.emitPaymentSucceeded({
        email: user.email,
        tier,
      });
    } catch (error) {
      this.logger.error(`Failed to emit payment succeeded event`, {
        userId,
        tier,
        error,
      });
      throw error;
    }

    this.logger.log(`Plan change completed successfully`, {
      userId,
      tier,
      previousTier: user.tier,
    });
  }

  private async getActiveSubscription(stripeCustomerId: string): Promise<Stripe.Subscription> {
    let subscription: Stripe.ApiList<Stripe.Subscription>;

    try {
      subscription = await this.stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });
    } catch (error) {
      this.logger.error(`Failed to list subscriptions from Stripe`, {
        stripeCustomerId,
        error,
      });
      throw error;
    }

    if (subscription.data.length === 0) {
      this.logger.warn(`User has no active subscription`, { stripeCustomerId });
      throw new ConflictException('You have no active subscription to change');
    }

    return subscription.data[0];
  }

  public async getCustomerPortalUrl(userId: string): Promise<string> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    if (!user.stripeCustomerId) {
      this.logger.warn(`User with id has no stripe customer id`, { userId });
      throw new NotFoundException('You have no billing account yet');
    }

    let session: Stripe.BillingPortal.Session;

    try {
      session = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: getEnvConfig().stripe.returnFromBillingUrl,
      });
    } catch (error) {
      this.logger.error(`Failed to create billing portal session`, {
        userId,
        stripeCustomerId: user.stripeCustomerId,
        error,
      });
      throw error;
    }

    this.logger.log(`Customer portal URL generated successfully`, { userId });

    return session.url;
  }
}
