import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserWriteService } from '../../user/write/user-write.service';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { UserReadService } from '../../user/read/user-read.service';
import { UserTierService } from '../../user/tier/user-tier.service';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class StripeService {
  private stripe = new Stripe(getEnvConfig().stripe.apiKeySecret);

  constructor(
    private readonly logger: Logger,
    private readonly userReadService: UserReadService,
    private readonly userTierService: UserTierService,
    private readonly userWriteService: UserWriteService,
  ) {}

  public async getPaymentSessionUrl(email: string): Promise<string> {
    this.logger.log(`Initiating payment session for user`, { email });

    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer_email: email,
      success_url: getEnvConfig().stripe.successUrl,
      mode: 'subscription',
      line_items: [
        {
          price: getEnvConfig().stripe.earlyBirdPriceId,
          quantity: 1,
        },
      ],
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
    });

    if (!checkoutSession.url) {
      this.logger.error(`Payment session contained no information for user`, {
        email,
      });

      throw new Error(`Failed to process payment for user: ${email}`);
    }

    return checkoutSession.url;
  }

  public async handlePaymentSucceeded(
    email: string,
    customerId: string,
    priceId: string,
  ): Promise<void> {
    this.logger.log(`Handling payment succeeded`, {
      email,
      priceId,
      customerId,
    });

    if (priceId === getEnvConfig().stripe.earlyBirdPriceId) {
      this.logger.log(`Payment succeeded for user`, { email });
      const user = await this.userReadService.readByEmail(email);

      if (!user) {
        this.logger.error(`User not found with email`, { email });
        return;
      }

      await this.userTierService.updateUserTier(user.id, UserTier.EarlyBird);
      await this.userWriteService.update({
        stripeCustomerId: customerId,
        id: user.id,
      });

      this.logger.log(`Updated user tier`, {
        email,
        newTier: UserTier.EarlyBird,
      });

      return;
    }

    this.logger.error(`Unknown product for user`, {
      email,
      priceId,
    });
  }

  public async handleSubscriptionDeleted(data: any): Promise<void> {
    const customer = await this.stripe.customers.retrieve(data.customer);

    const email = (customer as any).email;

    this.logger.log(`Subscription deleted for user`, { email });

    const user = await this.userReadService.readByEmail(email);

    if (!user) {
      this.logger.error(`User not found with email`, { email });
      return;
    }

    await this.userTierService.updateUserTier(user.id, UserTier.Free);

    this.logger.log(`Updated user tier`, {
      email,
      newTier: UserTier.Free,
    });
  }

  public async getCustomerPortalUrl(userId: string): Promise<string> {
    const user = await this.userReadService.readById(userId);

    if (!user) {
      this.logger.error(`User not found with id`, { userId });
      throw new Error(`User not found with id: ${userId}`);
    }

    if (!user.stripeCustomerId) {
      this.logger.error(`User with id has no stripe customer id`, { userId });
      throw new Error(`User with id: ${userId} has no stripe customer id`);
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: getEnvConfig().stripe.returnFromBillingUrl,
    });

    return session.url;
  }

  public async getEvent(body: any, signature: string): Promise<any> {
    try {
      return await this.stripe.webhooks.constructEvent(
        body,
        signature,
        getEnvConfig().stripe.signature,
      );
    } catch (error) {
      this.logger.log('Error while getting stripe event', { error });
    }
  }
}
