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

  describe('POST /admin/user/:userId/sync_subscription', () => {
    it('changes free users to early users', async () => {
      // given
      const setupFree = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'free@test.com',
        userTier: UserTier.Free,
      });

      const setupEarlyBird = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'earlyBird@test.com',
        userTier: UserTier.EarlyBird,
      });

      const setupContributor = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'contributor@test.com',
        userTier: UserTier.Contributor,
      });

      const setupPro = await bootstrap.utils.generalUtils.setupClaimed({
        email: 'pro@test.com',
        userTier: UserTier.Pro,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/admin/sync_subscription`)
        .set('super-secret-admin-key', adminKey);

      // then
      expect(response.status).toBe(201);

      const freeUser = await bootstrap.models.userModel.findOne({ email: 'free@test.com' });
      const earlyBirdUser = await bootstrap.models.userModel.findOne({
        email: 'earlyBird@test.com',
      });
      const contributorUser = await bootstrap.models.userModel.findOne({
        email: 'contributor@test.com',
      });
      const proUser = await bootstrap.models.userModel.findOne({ email: 'pro@test.com' });

      expect(freeUser!.tier).toBe(UserTier.EarlyUser);
      expect(earlyBirdUser!.tier).toBe(UserTier.EarlyBird);
      expect(contributorUser!.tier).toBe(UserTier.Contributor);
      expect(proUser!.tier).toBe(UserTier.Pro);
    });
  });
});
