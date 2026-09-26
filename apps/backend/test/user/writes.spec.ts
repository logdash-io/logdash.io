import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { advanceBy } from 'jest-date-mock';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { createTestApp } from '../utils/bootstrap';
import { CreateAnonymousUserResponse } from '../../src/user/core/dto/create-anonymous-user.response';
import { UserSerialized } from '../../src/user/core/entities/user.interface';
import { MarketingConsentGivenEvent } from '../../src/user/events/definitions/marketing-consent-given.event';
import { UserEvents } from '../../src/user/events/user-events.enum';

describe('UserCoreController (writes)', () => {
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

  it('creates anonymous user with cluster', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer()).post('/users/anonymous');

    // then
    const body = response.body as CreateAnonymousUserResponse;
    expect(body.token).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.cluster.creatorId).toBe(body.user.id);
  });

  it('creates anonymous user with token expiring together with the account', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer()).post('/users/anonymous');

    // then
    const payload = bootstrap.app
      .get(JwtService)
      .decode<{ iat: number; exp: number }>((response.body as CreateAnonymousUserResponse).token);

    expect(payload.exp - payload.iat).toEqual(
      getEnvConfig().anonymousAccounts.removeAfterHours * 3600,
    );
  });

  const putConsents = (token: string, body: object): request.Test =>
    request(bootstrap.app.getHttpServer())
      .put('/users/me/consents')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const putOnboarding = (token: string, body: object): request.Test =>
    request(bootstrap.app.getHttpServer())
      .put('/users/me/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const readUserEntity = async (userId: string) =>
    (await bootstrap.models.userModel.findById(new Types.ObjectId(userId)).lean())!;

  describe('PUT /users/me/consents', () => {
    it('records terms acceptance once and keeps the first timestamp', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const first = await putConsents(token, { termsAccepted: true, marketingConsent: false });
      advanceBy(60_000);
      const second = await putConsents(token, { termsAccepted: true, marketingConsent: false });

      // then
      expect(first.status).toEqual(200);
      expect(second.status).toEqual(200);
      expect((first.body as UserSerialized).termsAcceptedAt).toEqual(expect.any(String));
      expect((second.body as UserSerialized).termsAcceptedAt).toEqual(
        (first.body as UserSerialized).termsAcceptedAt,
      );
      expect((first.body as UserSerialized).onboardingCompletedAt).toBeNull();
    });

    it('adds user to the newsletter only when marketing consent is newly given', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'consent@test.com',
      });

      const consentEvents: MarketingConsentGivenEvent[] = [];
      const eventEmitter = bootstrap.app.get(EventEmitter2);
      const listener = (event: MarketingConsentGivenEvent): void => {
        consentEvents.push(event);
      };
      eventEmitter.on(UserEvents.MarketingConsentGiven, listener);

      // when
      await putConsents(token, { termsAccepted: true, marketingConsent: true });
      const marketingConsentAfterOptIn = (await readUserEntity(user.id)).marketingConsent;
      await putConsents(token, { termsAccepted: true, marketingConsent: true });
      await putConsents(token, { termsAccepted: true, marketingConsent: false });

      eventEmitter.off(UserEvents.MarketingConsentGiven, listener);

      // then
      expect(marketingConsentAfterOptIn).toEqual(true);
      expect((await readUserEntity(user.id)).marketingConsent).toEqual(false);
      expect(consentEvents).toEqual([{ userId: user.id, email: 'consent@test.com' }]);
    });

    it('rejects consents without terms accepted', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const responses = await Promise.all([
        putConsents(token, { termsAccepted: false, marketingConsent: true }),
        putConsents(token, { termsAccepted: 'true', marketingConsent: true }),
        putConsents(token, { marketingConsent: true }),
      ]);

      // then
      expect(responses.map((response) => response.status)).toEqual([400, 400, 400]);
      expect((await readUserEntity(user.id)).termsAcceptedAt).toBeUndefined();
    });

    it('forbids anonymous users', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await putConsents(token, { termsAccepted: true, marketingConsent: true });

      // then
      expect(response.status).toEqual(403);
    });
  });

  describe('PUT /users/me/onboarding', () => {
    it('stores onboarding answers without exposing them', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const response = await putOnboarding(token, { role: '  developer ', source: 'search' });

      // then
      const body = response.body as UserSerialized;
      expect(response.status).toEqual(200);
      expect(body.onboardingCompletedAt).toEqual(expect.any(String));
      expect(body).not.toHaveProperty('onboarding');

      const { onboarding } = await readUserEntity(user.id);
      expect(onboarding).toEqual({
        role: 'developer',
        source: 'search',
        completedAt: new Date(body.onboardingCompletedAt!),
      });
    });

    it('completes onboarding with the questions skipped', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const response = await putOnboarding(token, { role: '   ' });

      // then
      const body = response.body as UserSerialized;
      expect(response.status).toEqual(200);
      expect(body.onboardingCompletedAt).toEqual(expect.any(String));

      const { onboarding } = await readUserEntity(user.id);
      expect(onboarding).toEqual({ completedAt: new Date(body.onboardingCompletedAt!) });
    });

    it('rejects answers longer than 64 characters', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const response = await putOnboarding(token, { role: 'x'.repeat(65) });

      // then
      expect(response.status).toEqual(400);
      expect((await readUserEntity(user.id)).onboarding).toBeUndefined();
    });

    it('forbids anonymous users', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await putOnboarding(token, { role: 'developer', source: 'search' });

      // then
      expect(response.status).toEqual(403);
    });
  });
});
