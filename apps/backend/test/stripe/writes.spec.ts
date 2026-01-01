import { createTestApp } from '../utils/bootstrap';
import Stripe from 'stripe';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { StripePaymentSucceededHandler } from '../../src/payments/stripe/stripe.payment-succeeded.handler';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { StripeSubscriptionDeletedHandler } from '../../src/payments/stripe/stripe.subscription-deleted.handler';
import { sleep } from '../utils/sleep';

describe('StripeController (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('Invoice payment succeeded webhook', () => {
    it('upgrades user tier to early bird', async () => {
      // given
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.Free,
      });

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'mock-customer-id',
            customer_email: user.email,
            lines: {
              data: [
                {
                  pricing: {
                    price_details: {
                      price: { id: getEnvConfig().stripe.earlyBirdPriceId },
                    },
                  },
                },
              ],
            },
          },
        },
      } as unknown as Stripe.PaymentIntentSucceededEvent;

      // when
      const subscriptionSucceededHandler = bootstrap.app.get(StripePaymentSucceededHandler);

      await subscriptionSucceededHandler.handle(event);

      await sleep(500);

      // then
      const userAfterUpdate = await bootstrap.models.userModel.findById(user.id);
      const subscription = (await bootstrap.models.subscriptionModel.findOne())!;

      expect(userAfterUpdate!.tier).toBe(UserTier.EarlyBird);
      expect(userAfterUpdate!.stripeCustomerId).toBe('mock-customer-id');

      expect(subscription.tier).toBe(UserTier.EarlyBird);
      expect(subscription.userId).toBe(user.id);
      expect(subscription.endsAt).toBeNull();

      expect(userAfterUpdate!.paymentsMetadata?.trialUsed).toBe(true);
    });

    it('upgrades user tier to builder', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.Free,
      });

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'mock-customer-id',
            customer_email: user.email,
            lines: {
              data: [
                {
                  pricing: {
                    price_details: {
                      price: { id: getEnvConfig().stripe.builderPriceId },
                    },
                  },
                },
              ],
            },
          },
        },
      } as unknown as Stripe.PaymentIntentSucceededEvent;

      const subscriptionSucceededHandler = bootstrap.app.get(StripePaymentSucceededHandler);

      await subscriptionSucceededHandler.handle(event);

      await sleep(500);

      const userAfterUpdate = await bootstrap.models.userModel.findById(user.id);
      const subscription = (await bootstrap.models.subscriptionModel.findOne())!;

      expect(userAfterUpdate!.tier).toBe(UserTier.Builder);
      expect(userAfterUpdate!.stripeCustomerId).toBe('mock-customer-id');

      expect(subscription.tier).toBe(UserTier.Builder);
      expect(subscription.userId).toBe(user.id);
      expect(subscription.endsAt).toBeNull();

      expect(userAfterUpdate!.paymentsMetadata?.trialUsed).toBe(true);
    });

    it('upgrades user tier to pro', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.Free,
      });

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'mock-customer-id',
            customer_email: user.email,
            lines: {
              data: [
                {
                  pricing: {
                    price_details: {
                      price: { id: getEnvConfig().stripe.proPriceId },
                    },
                  },
                },
              ],
            },
          },
        },
      } as unknown as Stripe.PaymentIntentSucceededEvent;

      const subscriptionSucceededHandler = bootstrap.app.get(StripePaymentSucceededHandler);

      await subscriptionSucceededHandler.handle(event);

      await sleep(500);

      const userAfterUpdate = await bootstrap.models.userModel.findById(user.id);
      const subscription = (await bootstrap.models.subscriptionModel.findOne())!;

      expect(userAfterUpdate!.tier).toBe(UserTier.Pro);
      expect(userAfterUpdate!.stripeCustomerId).toBe('mock-customer-id');

      expect(subscription.tier).toBe(UserTier.Pro);
      expect(subscription.userId).toBe(user.id);
      expect(subscription.endsAt).toBeNull();

      expect(userAfterUpdate!.paymentsMetadata?.trialUsed).toBe(true);
    }, 60_000);
  });

  describe('Subscription deleted webhook', () => {
    it('degrades user tier to free', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.EarlyBird,
      });

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'mock-customer-id',
          },
        },
      } as unknown as Stripe.CustomerSubscriptionDeletedEvent;

      // when
      const subscriptionDeletedHandler = bootstrap.app.get(StripeSubscriptionDeletedHandler);

      await subscriptionDeletedHandler.handle(event);

      // then
      const userAfterUpdate = await bootstrap.models.userModel.findById(setup.user.id);
      const subscription = (await bootstrap.models.subscriptionModel.findOne())!;

      expect(userAfterUpdate!.tier).toBe(UserTier.Free);

      expect(subscription.tier).toBe(UserTier.EarlyBird);
      expect(subscription.userId).toBe(setup.user.id);
      expect(
        Math.abs(new Date(subscription.endsAt!).getTime() - new Date().getTime()),
      ).toBeLessThan(10_000);
    });
  });
});
