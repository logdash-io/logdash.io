import { addMinutes, setHours, subDays, subHours, subMinutes } from 'date-fns';
import { advanceTo } from 'jest-date-mock';
import { Types } from 'mongoose';
import request from 'supertest';
import { CustomDomainStatus } from '../../src/custom-domain/core/enums/custom-domain-status.enum';
import { HttpMonitorNormalized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpPingEntity } from '../../src/http-ping/core/entities/http-ping.entity';
import { StatusPageDto } from '../../src/status-page/core/dto/status-page.dto';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';
import { ErrorResponse } from '../utils/error-response';

describe('StatusPageCoreController (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  const now = new Date('2025-05-10T12:30:00.000Z');
  const today = new Date('2025-05-10T00:00:00.000Z');

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    advanceTo(now);
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  async function setupStatusPage(dto?: { monitorNames?: string[]; isPublic?: boolean }) {
    const setup = await bootstrap.utils.generalUtils.setupClaimed({ userTier: UserTier.Pro });
    const monitors: HttpMonitorNormalized[] = [];

    for (const name of dto?.monitorNames ?? ['Acme API']) {
      monitors.push(
        await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
          projectId: setup.project.id,
          name,
          claimed: true,
        }),
      );
    }

    const publicDashboard = await bootstrap.utils.publicDashboardUtils.createPublicDashboard({
      clusterId: setup.cluster.id,
      token: setup.token,
      httpMonitorsIds: monitors.map((monitor) => monitor.id),
      name: 'Acme status',
      isPublic: dto?.isPublic ?? true,
    });

    return { ...setup, monitors, publicDashboard };
  }

  function readStatusPage(statusPageId: string): request.Test {
    return request(bootstrap.app.getHttpServer()).get(`/v1/status_pages/${statusPageId}`);
  }

  async function createPings(
    httpMonitorId: string,
    pings: { minutesAgo: number; statusCode?: number; responseTimeMs?: number }[],
  ): Promise<void> {
    await bootstrap.clickhouseClient.insert({
      table: 'http_pings',
      values: pings.map((ping) =>
        HttpPingEntity.fromNormalized({
          id: new Types.ObjectId().toString(),
          httpMonitorId,
          statusCode: ping.statusCode ?? 200,
          responseTimeMs: ping.responseTimeMs ?? 100,
          createdAt: subMinutes(now, ping.minutesAgo),
        }),
      ),
      format: 'JSONEachRow',
    });
  }

  async function createBucket(dto: {
    httpMonitorId: string;
    timestamp: Date;
    successCount: number;
    failureCount: number;
    averageLatencyMs?: number;
  }): Promise<void> {
    await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket(dto);
  }

  describe('GET /v1/status_pages/:statusPageId', () => {
    it('composes the status page', async () => {
      // given
      const setup = await setupStatusPage();
      const [monitor] = setup.monitors;

      await createPings(monitor.id, [
        { minutesAgo: 10, responseTimeMs: 120 },
        { minutesAgo: 5, responseTimeMs: 80 },
      ]);
      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: setHours(subDays(today, 2), 9),
        successCount: 99,
        failureCount: 1,
        averageLatencyMs: 150,
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=60');

      const statusPage = response.body as StatusPageDto;
      expect(statusPage).toMatchObject({
        name: 'Acme status',
        status: 'operational',
        updatedAt: now.toISOString(),
      });
      expect(statusPage.monitors).toHaveLength(1);
      expect(statusPage.monitors[0]).toMatchObject({
        id: monitor.badgeKey,
        name: 'Acme API',
        status: 'up',
        uptime: {
          '1h': 100,
          '24h': 100,
          '7d': (101 / 102) * 100,
          '30d': (101 / 102) * 100,
          '90d': (101 / 102) * 100,
        },
        pings: [
          { createdAt: subMinutes(now, 10).toISOString(), statusCode: 200, responseTimeMs: 120 },
          { createdAt: subMinutes(now, 5).toISOString(), statusCode: 200, responseTimeMs: 80 },
        ],
      });
      expect(Object.keys(statusPage.monitors[0]).sort()).toEqual([
        'history',
        'id',
        'name',
        'pings',
        'status',
        'uptime',
      ]);
    });

    it('lists 90 UTC days oldest first with today last', async () => {
      // given
      const setup = await setupStatusPage();
      const [monitor] = setup.monitors;

      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: setHours(subDays(today, 2), 9),
        successCount: 99,
        failureCount: 1,
        averageLatencyMs: 150,
      });
      await createPings(monitor.id, [
        { minutesAgo: 10, responseTimeMs: 120 },
        { minutesAgo: 5, statusCode: 500, responseTimeMs: 80 },
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const { daily } = (response.body as StatusPageDto).monitors[0].history;

      expect(daily).toHaveLength(90);
      expect(daily.map((bucket) => bucket.timestamp)).toEqual(
        Array.from({ length: 90 }, (_, index) => subDays(today, 89 - index).toISOString()),
      );
      expect(daily[0]).toEqual({
        timestamp: subDays(today, 89).toISOString(),
        successCount: 0,
        failureCount: 0,
        averageLatencyMs: null,
      });
      expect(daily[87]).toEqual({
        timestamp: subDays(today, 2).toISOString(),
        successCount: 99,
        failureCount: 1,
        averageLatencyMs: 150,
      });
      expect(daily[89]).toEqual({
        timestamp: today.toISOString(),
        successCount: 1,
        failureCount: 1,
        averageLatencyMs: 100,
      });
    });

    it('splits the days at UTC midnight', async () => {
      // given
      advanceTo(new Date('2025-05-10T00:10:00.000Z'));
      const setup = await setupStatusPage();
      const [monitor] = setup.monitors;

      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: new Date('2025-05-09T23:00:00.000Z'),
        successCount: 5,
        failureCount: 1,
      });
      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: monitor.id,
        createdAt: new Date('2025-05-10T00:05:00.000Z'),
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;
      const { daily } = statusPage.monitors[0].history;

      expect(daily[88]).toMatchObject({
        timestamp: '2025-05-09T00:00:00.000Z',
        successCount: 5,
        failureCount: 1,
      });
      expect(daily[89]).toMatchObject({
        timestamp: '2025-05-10T00:00:00.000Z',
        successCount: 1,
        failureCount: 0,
      });
      expect(statusPage.monitors[0].uptime['24h']).toBe((6 / 7) * 100);
    });

    it('returns the last 100 pings oldest first', async () => {
      // given
      const setup = await setupStatusPage();
      const [monitor] = setup.monitors;

      await createPings(
        monitor.id,
        Array.from({ length: 105 }, (_, index) => ({ minutesAgo: index + 1 })),
      );

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const { pings } = (response.body as StatusPageDto).monitors[0];

      expect(pings).toHaveLength(100);
      expect(pings[0].createdAt).toBe(subMinutes(now, 100).toISOString());
      expect(pings[99].createdAt).toBe(subMinutes(now, 1).toISOString());
      expect(pings.map((ping) => ping.createdAt)).toEqual(
        pings.map((ping) => ping.createdAt).sort(),
      );
    });

    it('reports a monitor without pings as unknown and its uptime as missing', async () => {
      // given
      const setup = await setupStatusPage();

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.status).toBe('unknown');
      expect(statusPage.monitors[0]).toMatchObject({
        status: 'unknown',
        uptime: { '1h': null, '24h': null, '7d': null, '30d': null, '90d': null },
        pings: [],
      });
    });

    it('reports a monitor as down when its two latest pings failed', async () => {
      // given
      const setup = await setupStatusPage();

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 3, statusCode: 200 },
        { minutesAgo: 2, statusCode: 500 },
        { minutesAgo: 1, statusCode: 503 },
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.monitors[0].status).toBe('down');
      expect(statusPage.status).toBe('outage');
    });

    it('reports a monitor as degraded when only its latest ping failed', async () => {
      // given
      const setup = await setupStatusPage();

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 2, statusCode: 200 },
        { minutesAgo: 1, statusCode: 503 },
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.monitors[0].status).toBe('degraded');
      expect(statusPage.status).toBe('degraded');
    });

    it('reports a monitor as degraded when one of its 10 latest pings failed', async () => {
      // given
      const setup = await setupStatusPage();

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 2, statusCode: 500 },
        { minutesAgo: 1, statusCode: 200 },
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.monitors[0].status).toBe('degraded');
      expect(statusPage.status).toBe('degraded');
    });

    it('ignores failures older than the 10 latest pings for the status', async () => {
      // given
      const setup = await setupStatusPage();

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 11, statusCode: 500 },
        ...Array.from({ length: 10 }, (_, index) => ({ minutesAgo: index + 1 })),
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect((response.body as StatusPageDto).monitors[0].status).toBe('up');
    });

    it('reports an outage when every monitor with data is down', async () => {
      // given
      const setup = await setupStatusPage({ monitorNames: ['A', 'B'] });

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 2, statusCode: 500 },
        { minutesAgo: 1, statusCode: 500 },
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.monitors.map((monitor) => monitor.status)).toEqual(['down', 'unknown']);
      expect(statusPage.status).toBe('outage');
    });

    it('reports the page as degraded when only some monitors are down', async () => {
      // given
      const setup = await setupStatusPage({ monitorNames: ['A', 'B'] });

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 2, statusCode: 500 },
        { minutesAgo: 1, statusCode: 500 },
      ]);
      await createPings(setup.monitors[1].id, [{ minutesAgo: 1, statusCode: 200 }]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.monitors.map((monitor) => monitor.status)).toEqual(['down', 'up']);
      expect(statusPage.status).toBe('degraded');
    });

    it('reports the page as operational when every monitor with data is up', async () => {
      // given
      const setup = await setupStatusPage({ monitorNames: ['A', 'B'] });

      await createPings(setup.monitors[1].id, [{ minutesAgo: 1, statusCode: 200 }]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.monitors.map((monitor) => monitor.status)).toEqual(['unknown', 'up']);
      expect(statusPage.status).toBe('operational');
    });

    it('computes the 1h uptime from the pings of the last hour', async () => {
      // given
      const setup = await setupStatusPage();

      await createPings(setup.monitors[0].id, [
        { minutesAgo: 70, statusCode: 500 },
        { minutesAgo: 40, statusCode: 500 },
        { minutesAgo: 20, statusCode: 200 },
      ]);

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect((response.body as StatusPageDto).monitors[0].uptime['1h']).toBe(50);
    });

    it('computes the 24h uptime from the hourly buckets of the last 24 hours', async () => {
      // given
      const setup = await setupStatusPage();
      const [monitor] = setup.monitors;

      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: subHours(setHours(today, 12), 2),
        successCount: 3,
        failureCount: 1,
      });
      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: subHours(setHours(today, 12), 24),
        successCount: 0,
        failureCount: 5,
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const { uptime } = (response.body as StatusPageDto).monitors[0];

      expect(uptime['24h']).toBe(75);
      expect(uptime['7d']).toBe((3 / 9) * 100);
    });

    it('computes the 7d, 30d and 90d uptime from the latest daily buckets', async () => {
      // given
      const setup = await setupStatusPage();
      const [monitor] = setup.monitors;

      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: setHours(subDays(today, 6), 12),
        successCount: 1,
        failureCount: 0,
      });
      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: setHours(subDays(today, 20), 12),
        successCount: 0,
        failureCount: 1,
      });
      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: setHours(subDays(today, 80), 12),
        successCount: 0,
        failureCount: 2,
      });
      await createBucket({
        httpMonitorId: monitor.id,
        timestamp: setHours(subDays(today, 95), 12),
        successCount: 0,
        failureCount: 100,
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect((response.body as StatusPageDto).monitors[0].uptime).toEqual({
        '1h': null,
        '24h': null,
        '7d': 100,
        '30d': 50,
        '90d': 25,
      });
    });

    it('lists monitors in the order configured on the status page', async () => {
      // given
      const setup = await setupStatusPage({ monitorNames: ['A', 'B', 'C'] });
      const [monitorA, monitorB, monitorC] = setup.monitors;

      await bootstrap.models.publicDashboardModel.findByIdAndUpdate(setup.publicDashboard.id, {
        httpMonitorsIds: [monitorC.id, monitorA.id, monitorB.id],
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect((response.body as StatusPageDto).monitors.map((monitor) => monitor.name)).toEqual([
        'C',
        'A',
        'B',
      ]);
    });

    it('returns an empty status page when it has no monitors', async () => {
      // given
      const setup = await setupStatusPage({ monitorNames: [] });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: 'unknown', monitors: [] });
    });

    it('reads the status page by its verified custom domain', async () => {
      // given
      const setup = await setupStatusPage();

      const customDomain = await bootstrap.utils.customDomainUtils.createCustomDomain({
        domain: 'status.acme.com',
        publicDashboardId: setup.publicDashboard.id,
        token: setup.token,
      });

      await bootstrap.models.customDomainModel.findByIdAndUpdate(customDomain.id, {
        status: CustomDomainStatus.Verified,
      });

      // when
      const response = await readStatusPage('status.acme.com');

      // then
      expect(response.status).toBe(200);
      expect((response.body as StatusPageDto).name).toBe('Acme status');
    });

    it('returns 404 for a custom domain that is not verified', async () => {
      // given
      const setup = await setupStatusPage();

      await bootstrap.utils.customDomainUtils.createCustomDomain({
        domain: 'status.acme.com',
        publicDashboardId: setup.publicDashboard.id,
        token: setup.token,
      });

      // when
      const response = await readStatusPage('status.acme.com');

      // then
      expect(response.status).toBe(404);
      expect(response.headers['cache-control']).not.toBe('public, max-age=60');
    });

    it('returns 404 for an unknown custom domain', async () => {
      // when
      const response = await readStatusPage('status.unknown.com');

      // then
      expect(response.status).toBe(404);
    });

    it('returns 404 for an unknown status page', async () => {
      // when
      const response = await readStatusPage(new Types.ObjectId().toString());

      // then
      expect(response.status).toBe(404);
      expect((response.body as ErrorResponse).message).toBe('Status page not found');
    });

    it('returns 403 when the status page is not public', async () => {
      // given
      const setup = await setupStatusPage({ isPublic: false });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect(response.status).toBe(403);
      expect((response.body as ErrorResponse).message).toBe('Status page is not public');
      expect(response.headers['cache-control']).not.toBe('public, max-age=60');
    });

    it('serves the status page from cache', async () => {
      // given
      const setup = await setupStatusPage();

      await readStatusPage(setup.publicDashboard.id);
      await createPings(setup.monitors[0].id, [{ minutesAgo: 1 }]);
      advanceTo(addMinutes(now, 1));

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      const statusPage = response.body as StatusPageDto;

      expect(statusPage.updatedAt).toBe(now.toISOString());
      expect(statusPage.monitors[0].pings).toEqual([]);
    });

    it('does not serve a cached status page once it is no longer public', async () => {
      // given
      const setup = await setupStatusPage();

      await readStatusPage(setup.publicDashboard.id);
      await bootstrap.models.publicDashboardModel.findByIdAndUpdate(setup.publicDashboard.id, {
        isPublic: false,
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect(response.status).toBe(403);
    });

    it('stops resolving a cached status page by its custom domain once the domain is removed', async () => {
      // given
      const setup = await setupStatusPage();

      const customDomain = await bootstrap.utils.customDomainUtils.createCustomDomain({
        domain: 'status.acme.com',
        publicDashboardId: setup.publicDashboard.id,
        token: setup.token,
      });

      await bootstrap.models.customDomainModel.findByIdAndUpdate(customDomain.id, {
        status: CustomDomainStatus.Verified,
      });

      await readStatusPage('status.acme.com');
      await bootstrap.utils.customDomainUtils.deleteCustomDomain({
        token: setup.token,
        customDomainId: customDomain.id,
      });

      // when
      const response = await readStatusPage('status.acme.com');

      // then
      expect(response.status).toBe(404);
    });

    it('invalidates the cache when the status page is updated', async () => {
      // given
      const setup = await setupStatusPage();

      await readStatusPage(setup.publicDashboard.id);
      await bootstrap.utils.publicDashboardUtils.updatePublicDashboard({
        token: setup.token,
        id: setup.publicDashboard.id,
        name: 'Renamed',
      });

      // when
      const response = await readStatusPage(setup.publicDashboard.id);

      // then
      expect((response.body as StatusPageDto).name).toBe('Renamed');
    });

    it('invalidates the cache when a monitor is added or removed', async () => {
      // given
      const setup = await setupStatusPage({ monitorNames: ['A', 'B'] });
      const [monitorA] = setup.monitors;

      await readStatusPage(setup.publicDashboard.id);

      // when
      await request(bootstrap.app.getHttpServer())
        .delete(`/public_dashboards/${setup.publicDashboard.id}/monitors/${monitorA.id}`)
        .set('Authorization', `Bearer ${setup.token}`);
      const afterRemoval = await readStatusPage(setup.publicDashboard.id);

      await request(bootstrap.app.getHttpServer())
        .post(`/public_dashboards/${setup.publicDashboard.id}/monitors/${monitorA.id}`)
        .set('Authorization', `Bearer ${setup.token}`);
      const afterAddition = await readStatusPage(setup.publicDashboard.id);

      // then
      expect((afterRemoval.body as StatusPageDto).monitors.map((monitor) => monitor.name)).toEqual([
        'B',
      ]);
      expect((afterAddition.body as StatusPageDto).monitors.map((monitor) => monitor.name)).toEqual(
        ['B', 'A'],
      );
    });
  });
});
