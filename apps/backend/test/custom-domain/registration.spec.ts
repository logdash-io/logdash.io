import { createTestApp } from '../utils/bootstrap';
import { CustomDomainStatus } from '../../src/custom-domain/core/enums/custom-domain-status.enum';
import { CustomDomainRegistrationService } from '../../src/custom-domain/registration/custom-domain-registration.service';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

describe('CustomDomainRegistrationService', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let registrationService: CustomDomainRegistrationService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    registrationService = bootstrap.app.get(CustomDomainRegistrationService);
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    bootstrap.utils.customDomainUtils.resetDnsMock();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('verifies domain with correct CNAME record', async () => {
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

    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 0,
      targetCname: 'status.logdash.io',
    });

    // when
    await registrationService.verifyDomains();

    // then
    const updatedDomain =
      await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
        token,
        publicDashboardId: publicDashboard.id,
      });

    expect(updatedDomain.status).toBe(CustomDomainStatus.Verified);
    expect(updatedDomain.attemptCount).toBe(1);
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('example.com')).toBe(1);
  });

  it('increments attempt count when DNS check fails', async () => {
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

    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 999,
      targetCname: 'status.logdash.io',
    });

    // when
    await registrationService.verifyDomains();

    // then
    const updatedDomain =
      await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
        token,
        publicDashboardId: publicDashboard.id,
      });

    expect(updatedDomain.status).toBe(CustomDomainStatus.Verifying);
    expect(updatedDomain.attemptCount).toBe(1);
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('example.com')).toBe(1);
  });

  it('marks domain as failed after maximum attempts', async () => {
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

    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 999,
      targetCname: 'status.logdash.io',
    });

    // when
    for (let i = 0; i < 11; i++) {
      await registrationService.verifyDomains();
    }

    // then
    const updatedDomain =
      await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
        token,
        publicDashboardId: publicDashboard.id,
      });

    expect(updatedDomain.status).toBe(CustomDomainStatus.Failed);
    expect(updatedDomain.attemptCount).toBe(10);
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('example.com')).toBe(9);
  });

  it('eventually succeeds after multiple failed attempts', async () => {
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

    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 5,
      targetCname: 'status.logdash.io',
    });

    // when
    for (let i = 0; i < 6; i++) {
      await registrationService.verifyDomains();
    }

    // then
    const updatedDomain =
      await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
        token,
        publicDashboardId: publicDashboard.id,
      });

    expect(updatedDomain.status).toBe(CustomDomainStatus.Verified);
    expect(updatedDomain.attemptCount).toBe(6);
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('example.com')).toBe(6);
  });

  it('fails verification when CNAME points to wrong target', async () => {
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

    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 0,
      targetCname: 'wrong.target.com',
    });

    // when
    await registrationService.verifyDomains();

    // then
    const updatedDomain =
      await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
        token,
        publicDashboardId: publicDashboard.id,
      });

    expect(updatedDomain.status).toBe(CustomDomainStatus.Verifying);
    expect(updatedDomain.attemptCount).toBe(1);
  });

  it('skips domains that are already verified', async () => {
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

    // First verify the domain
    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 0,
      targetCname: 'status.logdash.io',
    });

    await registrationService.verifyDomains();

    // Reset mock call count
    bootstrap.utils.customDomainUtils.resetDnsMock();
    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 0,
      targetCname: 'status.logdash.io',
    });

    // when - run verification again
    await registrationService.verifyDomains();

    // then - should not make any DNS calls
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('example.com')).toBe(0);
  });

  it('skips domains that have failed', async () => {
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

    // Configure mock to fail and reach max attempts
    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 999,
      targetCname: 'status.logdash.io',
    });

    // Reach max attempts
    for (let i = 0; i < 100; i++) {
      await registrationService.verifyDomains();
    }

    // Reset mock call count
    bootstrap.utils.customDomainUtils.resetDnsMock();
    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'example.com',
      failCount: 999,
      targetCname: 'status.logdash.io',
    });

    // when - run verification again
    await registrationService.verifyDomains();

    // then - should not make any DNS calls
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('example.com')).toBe(0);
  });

  it('processes multiple domains independently', async () => {
    // given
    const { token, cluster } = await bootstrap.utils.generalUtils.setupClaimed({
      userTier: UserTier.Pro,
    });

    const publicDashboard1 = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
      clusterId: cluster.id,
      token,
      name: 'dashboard 1',
    });

    const publicDashboard2 = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
      clusterId: cluster.id,
      token,
      name: 'dashboard 2',
    });

    await bootstrap.utils.customDomainUtils.createCustomDomain({
      token,
      domain: 'domain1.com',
      publicDashboardId: publicDashboard1.id,
    });

    await bootstrap.utils.customDomainUtils.createCustomDomain({
      token,
      domain: 'domain2.com',
      publicDashboardId: publicDashboard2.id,
    });

    // Configure first domain to succeed, second to fail
    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'domain1.com',
      failCount: 0,
      targetCname: 'status.logdash.io',
    });

    bootstrap.utils.customDomainUtils.configureDomainMock({
      domain: 'domain2.com',
      failCount: 999,
      targetCname: 'status.logdash.io',
    });

    // when
    await registrationService.verifyDomains();

    // then
    const domain1 = await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
      token,
      publicDashboardId: publicDashboard1.id,
    });

    const domain2 = await bootstrap.utils.customDomainUtils.getCustomDomainByPublicDashboardId({
      token,
      publicDashboardId: publicDashboard2.id,
    });

    expect(domain1.status).toBe(CustomDomainStatus.Verified);
    expect(domain2.status).toBe(CustomDomainStatus.Verifying);
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('domain1.com')).toBe(1);
    expect(bootstrap.utils.customDomainUtils.getDnsCallCount('domain2.com')).toBe(1);
  });
});
