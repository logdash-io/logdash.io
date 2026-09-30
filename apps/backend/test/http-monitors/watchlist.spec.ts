import { subMinutes } from 'date-fns';
import { advanceTo } from 'jest-date-mock';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { BucketsResponse } from '../../src/http-ping-bucket/core/types/buckets.response';
import { BucketsPeriod } from '../../src/http-ping-bucket/core/types/bucket-period.enum';
import { HttpMonitorNormalized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpPingBucketNormalized } from '../../src/http-ping-bucket/core/entities/http-ping-bucket.interface';

describe('HttpMonitorCoreController (watchlist history)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  const now = new Date('2025-05-10T12:30:00.000Z');

  const history = [
    { timestamp: '2025-05-10T10:00:00.000Z', successCount: 60, failureCount: 0 },
    { timestamp: '2025-05-07T08:00:00.000Z', successCount: 40, failureCount: 20 },
    { timestamp: '2025-04-30T08:00:00.000Z', successCount: 30, failureCount: 30 },
    { timestamp: '2025-03-31T08:00:00.000Z', successCount: 58, failureCount: 2 },
  ];

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    advanceTo(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const setupWatchlist = async () => {
    const watchlist = await bootstrap.utils.generalUtils.setupClaimed({
      userTier: UserTier.Admin,
    });
    jest.replaceProperty(getEnvConfig().watchlist, 'projectId', watchlist.project.id);

    return watchlist;
  };

  const watch = async (projectId: string, url: string): Promise<HttpMonitorNormalized> => {
    const monitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId,
      url,
      claimed: true,
    });

    for (const bucket of history) {
      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        ...bucket,
        httpMonitorId: monitor.id,
        timestamp: new Date(bucket.timestamp),
      });
    }

    return monitor;
  };

  const readHistory = async (params: {
    monitorId: string;
    token: string;
    period: BucketsPeriod;
  }): Promise<{ timestamp: string; successCount: number; failureCount: number }[]> => {
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/monitors/${params.monitorId}/http_ping_buckets?period=${params.period}`)
      .set('Authorization', `Bearer ${params.token}`);

    expect(response.status).toBe(200);

    return (response.body as BucketsResponse).buckets.flatMap((bucket) =>
      bucket
        ? [
            {
              timestamp: bucket.timestamp as unknown as string,
              successCount: bucket.successCount,
              failureCount: bucket.failureCount,
            },
          ]
        : [],
    );
  };

  it('copies the history of the matching watchlist monitor to a monitor created in another project', async () => {
    // given
    const watchlist = await setupWatchlist();
    const watched = await watch(watchlist.project.id, 'https://example.com');
    const prospect = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: prospect.token,
      projectId: prospect.project.id,
      url: 'http://www.Example.com/',
    });

    // then
    expect(
      await readHistory({
        monitorId: monitor.id,
        token: prospect.token,
        period: BucketsPeriod.NinetyHours,
      }),
    ).toEqual(history.slice(0, 2));
    expect(
      await readHistory({
        monitorId: monitor.id,
        token: prospect.token,
        period: BucketsPeriod.NinetyDays,
      }),
    ).toEqual(
      history.map((bucket) => ({
        ...bucket,
        timestamp: `${bucket.timestamp.slice(0, 10)}T00:00:00.000Z`,
      })),
    );

    const watchedRows = await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({
      httpMonitorId: watched.id,
    });
    const copiedRows = await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({
      httpMonitorId: monitor.id,
    });
    const contentOf = (rows: HttpPingBucketNormalized[]): string[] =>
      rows
        .map((row) =>
          [
            row.timestamp.toISOString(),
            row.successCount,
            row.failureCount,
            row.averageLatencyMs,
          ].join(),
        )
        .sort();
    expect(watchedRows).toHaveLength(history.length);
    expect(contentOf(copiedRows)).toEqual(contentOf(watchedRows));
    expect(copiedRows.filter((row) => watchedRows.some(({ id }) => id === row.id))).toEqual([]);
  });

  it('copies from the oldest matching watchlist monitor', async () => {
    // given
    const watchlist = await setupWatchlist();
    advanceTo(subMinutes(now, 5));
    await watch(watchlist.project.id, 'https://example.com/');
    advanceTo(now);
    await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId: watchlist.project.id,
      url: 'https://www.example.com',
      claimed: true,
    });
    const prospect = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: prospect.token,
      projectId: prospect.project.id,
      url: 'https://example.com',
    });

    // then
    expect(
      await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({ httpMonitorId: monitor.id }),
    ).toHaveLength(history.length);
  });

  it('does not copy history to a monitor whose url does not match', async () => {
    // given
    const watchlist = await setupWatchlist();
    await watch(watchlist.project.id, 'https://example.com');
    const prospect = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: prospect.token,
      projectId: prospect.project.id,
      url: 'https://example.com/pricing',
    });

    // then
    expect(
      await readHistory({
        monitorId: monitor.id,
        token: prospect.token,
        period: BucketsPeriod.NinetyDays,
      }),
    ).toEqual([]);
  });

  it('does not copy history to a monitor created in the watchlist project', async () => {
    // given
    const watchlist = await setupWatchlist();
    await watch(watchlist.project.id, 'https://example.com');

    // when
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: watchlist.token,
      projectId: watchlist.project.id,
      url: 'http://www.Example.com/',
    });

    // then
    expect(
      await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({ httpMonitorId: monitor.id }),
    ).toEqual([]);
  });

  it('does not copy history when no watchlist project is configured', async () => {
    // given
    const watchlist = await bootstrap.utils.generalUtils.setupClaimed({
      userTier: UserTier.Admin,
    });
    jest.replaceProperty(getEnvConfig().watchlist, 'projectId', undefined);
    await watch(watchlist.project.id, 'https://example.com');
    const prospect = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: prospect.token,
      projectId: prospect.project.id,
      url: 'https://example.com',
    });

    // then
    expect(
      await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({ httpMonitorId: monitor.id }),
    ).toEqual([]);
  });

  it('keeps the copied history when the watchlist monitor is deleted', async () => {
    // given
    const watchlist = await setupWatchlist();
    const watched = await watch(watchlist.project.id, 'https://example.com');
    const prospect = await bootstrap.utils.generalUtils.setupAnonymous();
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: prospect.token,
      projectId: prospect.project.id,
      url: 'https://example.com',
    });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .delete(`/http_monitors/${watched.id}`)
      .set('Authorization', `Bearer ${watchlist.token}`);

    // then
    expect(response.status).toBe(200);
    expect(
      await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({ httpMonitorId: watched.id }),
    ).toEqual([]);
    expect(
      await readHistory({
        monitorId: monitor.id,
        token: prospect.token,
        period: BucketsPeriod.NinetyDays,
      }),
    ).toHaveLength(history.length);
  });
});
