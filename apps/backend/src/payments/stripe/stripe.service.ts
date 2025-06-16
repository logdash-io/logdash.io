import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserReadService } from '../../user/read/user-read.service';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class StripeService {
  private stripe = new Stripe(getEnvConfig().stripe.apiKeySecret);

  constructor(
    private readonly logger: Logger,
    private readonly userReadService: UserReadService,
  ) {}

  public async getPaymentSessionUrl(email: string): Promise<string> {
    this.logger.log(`[STRIPE] Initiating payment session for user`, { email });

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
      this.logger.error(`[STRIPE] Payment session contained no information for user`, {
        email,
      });

      throw new Error(`Failed to process payment for user: ${email}`);
    }

    return checkoutSession.url;
  }

  public async getCustomerPortalUrl(userId: string): Promise<string> {
    const user = await this.userReadService.readById(userId);

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
