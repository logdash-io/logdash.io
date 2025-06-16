import { createTestApp } from '../utils/bootstrap';
import Stripe from 'stripe';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { StripePaymentSucceededHandler } from '../../src/payments/stripe/stripe.payment-succeeded.handler';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { StripeSubscriptionDeletedHandler } from '../../src/payments/stripe/stripe.subscription-deleted.handler';
import { Types } from 'mongoose';

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
                  price: {
                    id: getEnvConfig().stripe.earlyBirdPriceId,
                  },
                },
              ],
            },
          },
        },
      } as unknown as Stripe.PaymentIntentSucceededEvent;

      // when
      const service = bootstrap.app.get(StripePaymentSucceededHandler);

      await service.handle(event);

      // then
      const userAfterUpdate = await bootstrap.models.userModel.findById(user.id);

      expect(userAfterUpdate!.tier).toBe(UserTier.EarlyBird);
      expect(userAfterUpdate!.stripeCustomerId).toBe('mock-customer-id');
    });
  });

  describe('Subscription deleted webhook', () => {
    it('degrades user tier to free', async () => {
      // given
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.EarlyBird,
      });

      await bootstrap.models.userModel.updateOne(
        {
          _id: new Types.ObjectId(user.id),
        },
        {
          stripeCustomerId: 'mock-customer-id',
        },
      );

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'mock-customer-id',
          },
        },
      } as unknown as Stripe.CustomerSubscriptionDeletedEvent;

      // when
      const service = bootstrap.app.get(StripeSubscriptionDeletedHandler);

      await service.handle(event);

      // then
      const userAfterUpdate = await bootstrap.models.userModel.findById(user.id);

      expect(userAfterUpdate!.tier).toBe(UserTier.Free);
    });
  });
});
