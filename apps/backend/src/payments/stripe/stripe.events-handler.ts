import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Logger } from '@logdash/js-sdk';
import { StripePaymentSucceededHandler } from './stripe.payment-succeeded.handler';
import { StripeSubscriptionDeletedHandler } from './stripe.subscription-deleted.handler';

@Injectable()
export class StripeEventsHandler {
  private stripe = new Stripe(getEnvConfig().stripe.apiKeySecret);

  constructor(
    private readonly logger: Logger,
    private readonly stripePaymentSucceededHandler: StripePaymentSucceededHandler,
    private readonly stripeSubscriptionDeletedHandler: StripeSubscriptionDeletedHandler,
  ) {}

  public async decryptEvent(body: any, signature: string): Promise<any> {
    try {
      return await this.stripe.webhooks.constructEvent(
        body,
        signature,
        getEnvConfig().stripe.signature,
      );
    } catch (error) {
      this.logger.log('[STRIPE] Error while getting stripe event', { error });
    }
  }

  public async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`[STRIPE] Handling stripe event`, { event });

    if (event.type === 'invoice.payment_succeeded') {
      return await this.stripePaymentSucceededHandler.handle(event);
    }

    if (event.type === 'customer.subscription.deleted') {
      return await this.stripeSubscriptionDeletedHandler.handle(event);
    }
  }
}
