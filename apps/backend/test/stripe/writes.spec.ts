import { createTestApp } from '../utils/bootstrap';
import Stripe from 'stripe';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { StripePaymentSucceededHandler } from '../../src/payments/stripe/stripe.payment-succeeded.handler';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { StripeSubscriptionDeletedHandler } from '../../src/payments/stripe/stripe.subscription-deleted.handler';
import { waitFor } from '../utils/wait-for';
import request from 'supertest';
import { ErrorResponse } from '../utils/error-response';
import { ChangePaidPlanBody } from '../../src/payments/stripe/dto/upgrade-subscription.body';
import { TelegramSendMessageBody } from '../utils/telegram-utils';

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

      await waitFor(
        () => bootstrap.models.userModel.findById(user.id).lean(),
        (found) => found?.paymentsMetadata?.trialUsed === true,
      );

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

    it('tells the team chat about the upgrade without the full email', async () => {
      // given
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'john.doe@gmail.com',
        userTier: UserTier.Free,
      });
      const originalBotToken = getEnvConfig().internal.telegram.botToken;
      getEnvConfig().internal.telegram.botToken = 'internal-token';
      const messages: TelegramSendMessageBody[] = [];
      bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
        botId: 'internal-token',
        onMessage: (body) => messages.push(body),
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

      // when
      await bootstrap.app.get(StripePaymentSucceededHandler).handle(event);
      await waitFor(
        () => Promise.resolve(messages.length),
        (count) => count > 0,
      );
      getEnvConfig().internal.telegram.botToken = originalBotToken;

      // then
      expect(messages[0].text).toBe(
        '🎉🎉🎉 User jo\\*\\*\\*@gm\\*\\*\\*\\.com got upgraded to builder 🎉🎉🎉',
      );
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

      await waitFor(
        () => bootstrap.models.userModel.findById(user.id).lean(),
        (found) => found?.paymentsMetadata?.trialUsed === true,
      );

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

      await waitFor(
        () => bootstrap.models.userModel.findById(user.id).lean(),
        (found) => found?.paymentsMetadata?.trialUsed === true,
      );

      const userAfterUpdate = await bootstrap.models.userModel.findById(user.id);
      const subscription = (await bootstrap.models.subscriptionModel.findOne())!;

      expect(userAfterUpdate!.tier).toBe(UserTier.Pro);
      expect(userAfterUpdate!.stripeCustomerId).toBe('mock-customer-id');

      expect(subscription.tier).toBe(UserTier.Pro);
      expect(subscription.userId).toBe(user.id);
      expect(subscription.endsAt).toBeNull();

      expect(userAfterUpdate!.paymentsMetadata?.trialUsed).toBe(true);
    }, 60_000);

    it('upgrades the owner of the Stripe customer, not the account matching the invoice email', async () => {
      // given
      const { user: subscriber } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'subscriber@test.com',
        userTier: UserTier.Free,
      });
      const { user: bystander } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'bystander@test.com',
        userTier: UserTier.Free,
      });
      await bootstrap.models.userModel.updateOne(
        { _id: subscriber.id },
        { stripeCustomerId: 'subscriber-customer-id' },
      );

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'subscriber-customer-id',
            customer_email: bystander.email,
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

      // when
      await bootstrap.app.get(StripePaymentSucceededHandler).handle(event);

      await waitFor(
        () => bootstrap.models.userModel.findById(subscriber.id).lean(),
        (found) => found?.paymentsMetadata?.trialUsed === true,
      );

      // then
      const subscriberAfterUpdate = await bootstrap.models.userModel.findById(subscriber.id);
      const bystanderAfterUpdate = await bootstrap.models.userModel.findById(bystander.id);

      expect(subscriberAfterUpdate!.tier).toBe(UserTier.Pro);
      expect(bystanderAfterUpdate!.tier).toBe(UserTier.Free);
      expect(bystanderAfterUpdate!.stripeCustomerId).toBeUndefined();
      expect(bystanderAfterUpdate!.paymentsMetadata?.trialUsed).toBeUndefined();
    });
  });

  describe('Subscription deleted webhook', () => {
    it('degrades user tier to free', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.EarlyBird,
      });

      const { stripeCustomerId } = (await bootstrap.models.userModel.findById(setup.user.id))!;

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: stripeCustomerId,
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

  describe('GET /payments/stripe/checkout', () => {
    it('refuses an account that is not claimed', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/payments/stripe/checkout?tier=${UserTier.Pro}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(403);
      expect((response.body as ErrorResponse).message).toBe(
        'Claim your account before subscribing',
      );
    });

    it.each([UserTier.EarlyBird, UserTier.Builder, UserTier.Pro])(
      'refuses a second subscription for a %s user',
      async (userTier) => {
        // given
        const { token } = await bootstrap.utils.generalUtils.setupClaimed({ userTier });

        // when
        const response = await request(bootstrap.app.getHttpServer())
          .get(`/payments/stripe/checkout?tier=${UserTier.Pro}`)
          .set('Authorization', `Bearer ${token}`);

        // then
        expect(response.status).toBe(409);
        expect((response.body as ErrorResponse).message).toBe(
          'You already have a paid plan, change it instead',
        );
      },
    );
  });

  describe('POST /payments/stripe/change_paid_plan', () => {
    const changePaidPlan = (token: string, body: ChangePaidPlanBody) =>
      request(bootstrap.app.getHttpServer())
        .post('/payments/stripe/change_paid_plan')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

    it('refuses the plan the user is already on', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      // when
      const response = await changePaidPlan(token, { tier: UserTier.Pro });

      // then
      expect(response.status).toBe(409);
      expect((response.body as ErrorResponse).message).toBe('You are already on this plan');
    });

    it('sends a free user to checkout', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Free,
      });

      // when
      const response = await changePaidPlan(token, { tier: UserTier.Pro });

      // then
      expect(response.status).toBe(400);
      expect((response.body as ErrorResponse).message).toBe(
        'Subscribe through checkout to start a paid plan',
      );
    });

    it('refuses a paid user without a Stripe customer', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      // when
      const response = await changePaidPlan(token, { tier: UserTier.Builder });

      // then
      expect(response.status).toBe(409);
      expect((response.body as ErrorResponse).message).toBe(
        'You have no active subscription to change',
      );
    });

    it('refuses a Stripe customer without an active subscription', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      await bootstrap.models.userModel.updateOne(
        { _id: user.id },
        { stripeCustomerId: 'mock-customer-id' },
      );
      jest
        .spyOn(bootstrap.app.get(Stripe).subscriptions, 'list')
        .mockResolvedValueOnce({ data: [] } as unknown as Stripe.Response<
          Stripe.ApiList<Stripe.Subscription>
        >);

      // when
      const response = await changePaidPlan(token, { tier: UserTier.Builder });

      // then
      expect(response.status).toBe(409);
      expect((response.body as ErrorResponse).message).toBe(
        'You have no active subscription to change',
      );
    });
  });

  describe('GET /payments/stripe/customer_portal', () => {
    it('refuses a user without a Stripe customer', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get('/payments/stripe/customer_portal')
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(404);
      expect((response.body as ErrorResponse).message).toBe('You have no billing account yet');
    });
  });
});
