import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { CustomDomainStatus } from '../../src/custom-domain/core/enums/custom-domain-status.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

describe('CustomDomainCoreController (writes)', () => {
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

  describe('POST /public_dashboards/:publicDashboardId/custom_domains', () => {
    it('creates custom domain', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      const domain = 'example.com';

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/public_dashboards/${publicDashboard.id}/custom_domains`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain,
        });

      // then
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        domain,
        publicDashboardId: publicDashboard.id,
        attemptCount: 0,
        status: CustomDomainStatus.Verifying,
      });
    });

    it('returns 400 when domain is invalid', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/public_dashboards/${publicDashboard.id}/custom_domains`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain: 'invalid-domain',
        });

      // then
      expect(response.status).toBe(400);
    });

    it('returns 409 when domain already exists', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      const domain = 'example.com';

      await bootstrap.utils.customDomainUtils.createCustomDomain({
        token,
        domain,
        publicDashboardId: publicDashboard.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/public_dashboards/${publicDashboard.id}/custom_domains`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain,
        });

      // then
      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /custom_domains/:customDomainId', () => {
    it('deletes custom domain', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      const customDomain = await bootstrap.utils.customDomainUtils.createCustomDomain({
        token,
        domain: 'example.com',
        publicDashboardId: publicDashboard.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .delete(`/custom_domains/${customDomain.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(200);

      const deletedDomain = await bootstrap.models.customDomainModel.findById(customDomain.id);
      expect(deletedDomain).toBeNull();
    });

    it('deletes custom domain when public dashboard is deleted', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      const customDomain = await bootstrap.utils.customDomainUtils.createCustomDomain({
        token,
        domain: 'example.com',
        publicDashboardId: publicDashboard.id,
      });

      // when - delete public dashboard
      await request(bootstrap.app.getHttpServer())
        .delete(`/public_dashboards/${publicDashboard.id}`)
        .set('Authorization', `Bearer ${token}`);

      // then - custom domain should be deleted
      const domainAfterDelete = await bootstrap.models.customDomainModel.findById(customDomain.id);
      expect(domainAfterDelete).toBeNull();
    });

    it('does not let create custom domain when cluster tier does not support it', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Free,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/public_dashboards/${publicDashboard.id}/custom_domains`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain: 'example.com',
        });

      // then
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Custom domains are not supported for this cluster tier');
    });
  });
});
