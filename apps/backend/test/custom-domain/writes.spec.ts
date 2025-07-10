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

  describe('PUT /custom_domains/:customDomainId', () => {
    it('updates custom domain and resets verification status', async () => {
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

      await bootstrap.models.customDomainModel.findByIdAndUpdate(customDomain.id, {
        attemptCount: 5,
        status: CustomDomainStatus.Failed,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/custom_domains/${customDomain.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain: 'updated-example.com',
        });

      // then
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        domain: 'updated-example.com',
        publicDashboardId: publicDashboard.id,
        attemptCount: 0,
        status: CustomDomainStatus.Verifying,
      });

      const updatedDomain = await bootstrap.models.customDomainModel.findById(customDomain.id);
      expect(updatedDomain?.domain).toBe('updated-example.com');
      expect(updatedDomain?.attemptCount).toBe(0);
      expect(updatedDomain?.status).toBe(CustomDomainStatus.Verifying);
    });

    it('returns 409 when domain already exists', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard1 = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard 1',
      });

      const publicDashboard2 = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard 2',
      });

      const customDomain1 = await bootstrap.utils.customDomainUtils.createCustomDomain({
        token,
        domain: 'existing-domain.com',
        publicDashboardId: publicDashboard1.id,
      });

      const customDomain2 = await bootstrap.utils.customDomainUtils.createCustomDomain({
        token,
        domain: 'other-domain.com',
        publicDashboardId: publicDashboard2.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/custom_domains/${customDomain2.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain: 'existing-domain.com',
        });

      // then
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Domain already exists');
    });

    it('allows updating to the same domain', async () => {
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
        domain: 'same-domain.com',
        publicDashboardId: publicDashboard.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/custom_domains/${customDomain.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          domain: 'same-domain.com',
        });

      // then
      expect(response.status).toBe(200);
      expect(response.body.domain).toBe('same-domain.com');
    });

    it('throws 403 when user is not a member of the cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });
      const setupB = await bootstrap.utils.generalUtils.setupClaimed({
        userTier: UserTier.Pro,
      });

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: setupA.cluster.id,
        token: setupA.token,
        name: 'test dashboard',
      });

      const customDomain = await bootstrap.utils.customDomainUtils.createCustomDomain({
        token: setupA.token,
        domain: 'example.com',
        publicDashboardId: publicDashboard.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .put(`/custom_domains/${customDomain.id}`)
        .set('Authorization', `Bearer ${setupB.token}`)
        .send({
          domain: 'updated-example.com',
        });

      // then
      expect(response.status).toEqual(403);
    });
  });
});
