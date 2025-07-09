import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { CustomDomainSerialized } from '../../src/custom-domain/core/entities/custom-domain.interface';
import { CustomDomainStatus } from '../../src/custom-domain/core/enums/custom-domain-status.enum';

describe('CustomDomainCoreController (reads)', () => {
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

  describe('GET /public_dashboards/:publicDashboardId/custom_domain', () => {
    it('reads custom domain by public dashboard id', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

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
        .get(`/public_dashboards/${publicDashboard.id}/custom_domain`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const result: CustomDomainSerialized = response.body;
      expect(response.status).toBe(200);
      expect(result.id).toBe(customDomain.id);
      expect(result.domain).toBe('example.com');
      expect(result.publicDashboardId).toBe(publicDashboard.id);
      expect(result.status).toBe(CustomDomainStatus.Verifying);
      expect(result.attemptCount).toBe(0);
    });

    it('returns 404 when custom domain not found', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: cluster.id,
        token,
        name: 'test dashboard',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/public_dashboards/${publicDashboard.id}/custom_domain`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toBe(404);
    });

    it('returns 403 when user is not a cluster member', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
        clusterId: setupA.cluster.id,
        token: setupA.token,
        name: 'test dashboard',
      });

      await bootstrap.utils.customDomainUtils.createCustomDomain({
        token: setupA.token,
        domain: 'example.com',
        publicDashboardId: publicDashboard.id,
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/public_dashboards/${publicDashboard.id}/custom_domain`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toBe(403);
    });
  });
});
