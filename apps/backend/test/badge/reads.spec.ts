import { setHours, startOfHour, subDays, subHours, subMinutes } from 'date-fns';
import { advanceTo } from 'jest-date-mock';
import * as request from 'supertest';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';

describe('BadgeCoreController (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    advanceTo(new Date('2025-05-10T12:30:00.000Z'));
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  async function setupBadge(dto?: { isPro?: boolean; isPublic?: boolean; name?: string }) {
    const setup = dto?.isPro
      ? await bootstrap.utils.generalUtils.setupClaimed({ userTier: UserTier.Pro })
      : await bootstrap.utils.generalUtils.setupAnonymous();

    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      name: dto?.name ?? 'Acme API',
    });

    const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
      clusterId: setup.cluster.id,
      token: setup.token,
      httpMonitorsIds: [monitor.id],
      isPublic: dto?.isPublic ?? true,
    });

    return { ...setup, monitor, publicDashboard };
  }

  function readBadge(publicDashboardId: string, badgeKey: string, query = ''): request.Test {
    return request(bootstrap.app.getHttpServer())
      .get(`/public_dashboards/${publicDashboardId}/badges/${badgeKey}.svg${query}`)
      .buffer(true)
      .parse((response, callback) => {
        let text = '';
        response.on('data', (chunk) => (text += chunk));
        response.on('end', () => callback(null, text));
      });
  }

  function readTitle(response: request.Response): string {
    return (response.body as string).match(/<title>(.*)<\/title>/)![1];
  }

  describe('GET /public_dashboards/:publicDashboardId/badges/:badgeKey.svg', () => {
    it('renders the classic badge over the days the monitor has data for', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: setup.monitor.id,
        timestamp: subDays(new Date(), 2),
        successCount: 999,
        failureCount: 1,
      });

      // when
      const response = await readBadge(setup.publicDashboard.id, setup.monitor.badgeKey);

      // then
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/svg+xml; charset=utf-8');
      expect(response.headers['cache-control']).toBe('public, max-age=60');
      expect(response.headers['content-security-policy']).toBe(
        "default-src 'none'; style-src 'unsafe-inline'",
      );
      expect(readTitle(response)).toBe('uptime 3d: 99.90%');
    });

    it('never rounds downtime up to 100%', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: setup.monitor.id,
        timestamp: subDays(new Date(), 1),
        successCount: 99999,
        failureCount: 1,
      });

      // when
      const response = await readBadge(setup.publicDashboard.id, setup.monitor.badgeKey);

      // then
      expect(readTitle(response)).toBe('uptime 2d: 99.99%');
    });

    it('renders the classic badge over hours for the 24h period', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: setup.monitor.id,
        timestamp: subHours(new Date(), 2),
        successCount: 3,
        failureCount: 1,
      });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?period=24h',
      );

      // then
      expect(readTitle(response)).toBe('uptime 3h: 75.00%');
    });

    it('counts the oldest hour of the 24h period', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: setup.monitor.id,
        timestamp: startOfHour(subHours(new Date(), 23)),
        successCount: 1,
        failureCount: 0,
      });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?period=24h',
      );

      // then
      expect(readTitle(response)).toBe('uptime 24h: 100%');
    });

    it('counts the whole oldest day of the 90d period', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: setup.monitor.id,
        timestamp: setHours(startOfHour(subDays(new Date(), 89)), 12),
        successCount: 1,
        failureCount: 0,
      });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?period=90d',
      );

      // then
      expect(readTitle(response)).toBe('uptime 90d: 100%');
    });

    it('renders the requested period when the monitor has no data yet', async () => {
      // given
      const setup = await setupBadge();

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?period=7d',
      );

      // then
      expect(readTitle(response)).toBe('uptime 7d: no data');
    });

    it('renders the status badge from the recent pings', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: setup.monitor.id,
        statusCode: 500,
        createdAt: subMinutes(new Date(), 2),
      });

      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: setup.monitor.id,
        statusCode: 200,
        createdAt: subMinutes(new Date(), 1),
      });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?style=status&theme=dark',
      );

      // then
      expect(response.status).toBe(200);
      expect(readTitle(response)).toBe('Acme API: Degraded');
    });

    it('renders the status badge as down when the latest ping failed', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: setup.monitor.id,
        statusCode: 503,
      });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?style=status',
      );

      // then
      expect(readTitle(response)).toBe('Acme API: Down');
    });

    it('renders the card badge with 90 days of history', async () => {
      // given
      const setup = await setupBadge();

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: setup.monitor.id,
        timestamp: subDays(new Date(), 10),
        successCount: 99,
        failureCount: 1,
      });

      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: setup.monitor.id,
        statusCode: 200,
        createdAt: subDays(new Date(), 1),
      });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?style=card',
      );

      // then
      expect(response.status).toBe(200);
      expect(readTitle(response)).toBe('Acme API: Operational, 99.00% uptime over 90 days');
      expect((response.body as string).match(/rx="1"/g)).toHaveLength(90);
    });

    it('shows the logdash mark on free plans', async () => {
      // given
      const setup = await setupBadge();

      // when
      const response = await readBadge(setup.publicDashboard.id, setup.monitor.badgeKey);

      // then
      expect(response.body).toContain('mark-top');
    });

    it('hides the logdash mark on plans with custom domains', async () => {
      // given
      const setup = await setupBadge({ isPro: true });

      // when
      const response = await readBadge(setup.publicDashboard.id, setup.monitor.badgeKey);

      // then
      expect(response.status).toBe(200);
      expect(response.body).not.toContain('mark-top');
    });

    it('reads the badge by custom domain', async () => {
      // given
      const setup = await setupBadge({ isPro: true });

      const customDomain = await bootstrap.utils.customDomainUtils.createCustomDomain({
        domain: 'status.test.com',
        publicDashboardId: setup.publicDashboard.id,
        token: setup.token,
      });

      // when
      const response = await readBadge(customDomain.domain, setup.monitor.badgeKey);

      // then
      expect(response.status).toBe(200);
      expect(readTitle(response)).toBe('uptime 30d: no data');
    });

    it('escapes the monitor name', async () => {
      // given
      const setup = await setupBadge({ name: '<script>"&\'</script>' });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?style=status',
      );

      // then
      expect(response.body).not.toContain('<script>');
      expect(readTitle(response)).toBe('&lt;script&gt;&quot;&amp;&apos;&lt;/script&gt;: Unknown');
    });

    it('serves the badge from cache', async () => {
      // given
      const setup = await setupBadge();

      await readBadge(setup.publicDashboard.id, setup.monitor.badgeKey, '?style=status');

      await request(bootstrap.app.getHttpServer())
        .put(`/http_monitors/${setup.monitor.id}`)
        .set('Authorization', `Bearer ${setup.token}`)
        .send({ name: 'Renamed' });

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?style=status',
      );

      // then
      expect(readTitle(response)).toBe('Acme API: Unknown');
    });

    it('returns 404 when the status page is not public', async () => {
      // given
      const setup = await setupBadge({ isPublic: false });

      // when
      const response = await readBadge(setup.publicDashboard.id, setup.monitor.badgeKey);

      // then
      expect(response.status).toBe(404);
    });

    it('returns 404 for a monitor that is not on the status page', async () => {
      // given
      const setup = await setupBadge();

      const otherMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setup.token,
        projectId: setup.project.id,
      });

      // when
      const response = await readBadge(setup.publicDashboard.id, otherMonitor.badgeKey);

      // then
      expect(response.status).toBe(404);
    });

    it('does not accept the monitor id in place of the badge key', async () => {
      // given
      const setup = await setupBadge();

      // when
      const response = await readBadge(setup.publicDashboard.id, setup.monitor.id);

      // then
      expect(response.status).toBe(404);
    });

    it('returns 404 for an unknown custom domain', async () => {
      // given
      const setup = await setupBadge();

      // when
      const response = await readBadge('status.unknown.com', setup.monitor.badgeKey);

      // then
      expect(response.status).toBe(404);
    });

    it('rejects an unknown style', async () => {
      // given
      const setup = await setupBadge();

      // when
      const response = await readBadge(
        setup.publicDashboard.id,
        setup.monitor.badgeKey,
        '?style=huge',
      );

      // then
      expect(response.status).toBe(400);
    });
  });
});
