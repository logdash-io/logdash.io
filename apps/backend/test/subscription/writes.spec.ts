import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { addDays, addHours } from 'date-fns';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';
import { sleep } from '../utils/sleep';

describe('SubscriptionCoreController', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  const adminKey = getEnvConfig().admin.superSecretAdminKey;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('POST /admin/user/:userId/apply_new_subscription', () => {
    it('applies new subscription successfully with valid admin key', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/apply_new_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          tier: UserTier.Contributor,
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      await sleep(200);

      expect(response.status).toBe(201);

      const subscription = await bootstrap.models.subscriptionModel.findOne({
        userId: user.id,
      });
      const clusterAfterUpdate = await bootstrap.models.clusterModel.findOne({
        creatorId: user.id,
      });

      expect(clusterAfterUpdate!.tier).toBe(ClusterTier.Contributor);
      expect(subscription!.tier).toBe(UserTier.Contributor);
      expect(new Date(subscription!.endsAt!)).toEqual(new Date('2024-12-31T23:59:59.000Z'));
    });

    it('returns 401 with invalid admin key', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/apply_new_subscription`)
        .set('super-secret-admin-key', 'invalid-key')
        .send({
          tier: UserTier.Contributor,
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid admin key');
    });

    it('returns 400 when user already has active subscription', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.EarlyBird,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/apply_new_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          tier: UserTier.Contributor,
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already has active subscription');
    });

    it('returns 400 with invalid tier', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/apply_new_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          tier: UserTier.EarlyBird,
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /admin/user/:userId/extend_active_subscription', () => {
    it('extends active subscription successfully', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const now = new Date();
      const initialEndsAt = addDays(now, 7);

      await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/apply_new_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          tier: UserTier.Contributor,
          endsAt: initialEndsAt.toISOString(),
        });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/extend_active_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          endsAt: addDays(initialEndsAt, 7).toISOString(),
        });

      expect(response.status).toBe(201);

      const subscription = await bootstrap.models.subscriptionModel.findOne({
        userId: user.id,
      });
      expect(new Date(subscription!.endsAt!)).toEqual(addDays(initialEndsAt, 7));
    });

    it('returns 401 with invalid admin key', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/extend_active_subscription`)
        .set('super-secret-admin-key', 'invalid-key')
        .send({
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid admin key');
    });

    it('returns 400 when user has no active subscription', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/extend_active_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User does not have active subscription');
    });

    it('returns 400 when trying to extend early bird subscription', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.EarlyBird,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/extend_active_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          endsAt: '2024-12-31T23:59:59.000Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot change expiration date of paid subscription');
    });
  });

  describe('POST /admin/user/:userId/end_active_subscription', () => {
    it('ends active subscription successfully with valid admin key', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/apply_new_subscription`)
        .set('super-secret-admin-key', adminKey)
        .send({
          tier: UserTier.Contributor,
          endsAt: addHours(new Date(), 1),
        });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/end_active_subscription`)
        .set('super-secret-admin-key', adminKey);

      expect(response.status).toBe(201);

      const subscription = await bootstrap.models.subscriptionModel.findOne({
        userId: user.id,
      });
      expect(
        Math.abs(new Date(subscription!.endsAt!).getTime() - new Date().getTime()),
      ).toBeLessThan(5_000);
    });

    it('returns 401 with invalid admin key', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.Contributor,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/end_active_subscription`)
        .set('super-secret-admin-key', 'invalid-key');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid admin key');
    });

    it('returns 400 when user has no active subscription', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/end_active_subscription`)
        .set('super-secret-admin-key', adminKey);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User does not have active subscription');
    });

    it('returns 400 when trying to end early bird subscription', async () => {
      const { user } = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'test@test.com',
        userTier: UserTier.EarlyBird,
      });

      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/user/${user.id}/end_active_subscription`)
        .set('super-secret-admin-key', adminKey);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot end early bird subscription');
    });
  });
});
