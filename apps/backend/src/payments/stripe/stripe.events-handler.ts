import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STRIPE_LOGGER } from '../../shared/logdash/logdash-tokens';
import { StripePaymentSucceededHandler } from './stripe.payment-succeeded.handler';
import { StripeSubscriptionDeletedHandler } from './stripe.subscription-deleted.handler';

@Injectable()
export class StripeEventsHandler {
  constructor(
    @Inject(STRIPE_LOGGER) private readonly logger: LogdashLogger,
    private readonly stripe: Stripe,
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
      this.logger.error('Error while getting stripe event', { error });
    }
  }

  public async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling stripe event`, { event });

    if (event.type === 'invoice.payment_succeeded') {
      return await this.stripePaymentSucceededHandler.handle(event);
    }

    if (event.type === 'customer.subscription.deleted') {
      return await this.stripeSubscriptionDeletedHandler.handle(event);
    }

    this.logger.warn(`Unhandled event type, skipping`, { eventType: event.type });
  }
}
