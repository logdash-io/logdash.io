import type { Bucket, Monitor, Ping, StatusPage } from '@logdash/status';

const DAYS = 90;
const PINGS = 100;
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const CHECKS_PER_DAY = DAY_MS / MINUTE_MS;

type DemoMonitor = {
  id: string;
  name: string;
  latencyMs: number;
  addedDaysAgo: number;
  failuresByDaysAgo: Record<number, number>;
  failedPingsAgo: number[];
};

const DEMO_MONITORS: DemoMonitor[] = [
  {
    id: 'demo-api',
    name: 'API',
    latencyMs: 124,
    addedDaysAgo: DAYS,
    failuresByDaysAgo: { 25: 262, 71: 4 },
    failedPingsAgo: [],
  },
  {
    id: 'demo-dashboard',
    name: 'Dashboard',
    latencyMs: 212,
    addedDaysAgo: 68,
    failuresByDaysAgo: {},
    failedPingsAgo: [],
  },
  {
    id: 'demo-email-queue',
    name: 'Email queue',
    latencyMs: 318,
    addedDaysAgo: DAYS,
    failuresByDaysAgo: { 12: 37, 13: 911, 58: 9, 0: 5 },
    failedPingsAgo: [4, 5, 6, 61, 62],
  },
];

export function generateDemoStatusPage(): StatusPage {
  const now = Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
  const today = Math.floor(now / DAY_MS) * DAY_MS;
  // A fixed half day, so the prerendered page and the browser render the same numbers.
  const checksToday = CHECKS_PER_DAY / 2;
  const monitors = DEMO_MONITORS.map((monitor, index) =>
    createMonitor(monitor, createRandom(index + 1), now, today, checksToday),
  );

  return {
    name: 'Acme',
    status: getPageStatus(monitors),
    updatedAt: new Date(now).toISOString(),
    monitors,
  };
}

function createMonitor(
  monitor: DemoMonitor,
  random: () => number,
  now: number,
  today: number,
  checksToday: number,
): Monitor {
  const daily = Array.from({ length: DAYS }, (_, index): Bucket => {
    const daysAgo = DAYS - 1 - index;
    const timestamp = new Date(today - daysAgo * DAY_MS).toISOString();
    const checks = daysAgo === 0 ? checksToday : CHECKS_PER_DAY;

    if (daysAgo >= monitor.addedDaysAgo || checks === 0) {
      return {
        timestamp,
        successCount: 0,
        failureCount: 0,
        averageLatencyMs: null,
      };
    }

    const failures = monitor.failuresByDaysAgo[daysAgo] ?? 0;
    const failureCount =
      daysAgo === 0 ? Math.min(failures, Math.floor(checks / 10)) : failures;
    const slowdown = failureCount ? 1.6 : 1;

    return {
      timestamp,
      successCount: checks - failureCount,
      failureCount,
      averageLatencyMs: Math.round(
        monitor.latencyMs * slowdown * (0.92 + random() * 0.16),
      ),
    };
  });
  const pings = Array.from({ length: PINGS }, (_, index): Ping => {
    const pingsAgo = PINGS - 1 - index;
    const failed = monitor.failedPingsAgo.includes(pingsAgo);

    return {
      createdAt: new Date(now - pingsAgo * MINUTE_MS).toISOString(),
      statusCode: failed ? 503 : 200,
      responseTimeMs: Math.round(
        failed
          ? monitor.latencyMs * 3.2 + random() * 400
          : monitor.latencyMs * (0.9 + random() * 0.2) +
              (random() > 0.96 ? random() * monitor.latencyMs : 0),
      ),
    };
  });

  return {
    id: monitor.id,
    name: monitor.name,
    status: getMonitorStatus(pings),
    uptime: {
      '1h': getPingsUptime(pings.slice(-60)),
      '24h': getBucketsUptime(daily.slice(-2)),
      '7d': getBucketsUptime(daily.slice(-7)),
      '30d': getBucketsUptime(daily.slice(-30)),
      '90d': getBucketsUptime(daily),
    },
    history: { daily },
    pings,
  };
}

function getMonitorStatus(pings: Ping[]): Monitor['status'] {
  const recent = pings.slice(-10);

  if (!recent.length) {
    return 'unknown';
  }

  if (!isHealthy(recent[recent.length - 1])) {
    return 'down';
  }

  return recent.every(isHealthy) ? 'up' : 'degraded';
}

function getPageStatus(monitors: Monitor[]): StatusPage['status'] {
  const known = monitors.filter((monitor) => monitor.status !== 'unknown');

  if (!known.length) {
    return 'unknown';
  }

  if (known.every((monitor) => monitor.status === 'down')) {
    return 'outage';
  }

  return known.some((monitor) => monitor.status !== 'up')
    ? 'degraded'
    : 'operational';
}

function getBucketsUptime(buckets: Bucket[]): number | null {
  const success = buckets.reduce((sum, bucket) => sum + bucket.successCount, 0);
  const total = buckets.reduce(
    (sum, bucket) => sum + bucket.successCount + bucket.failureCount,
    0,
  );

  return total ? (success / total) * 100 : null;
}

function getPingsUptime(pings: Ping[]): number | null {
  return pings.length
    ? (pings.filter(isHealthy).length / pings.length) * 100
    : null;
}

function isHealthy(ping: Ping): boolean {
  return ping.statusCode >= 200 && ping.statusCode < 400;
}

function createRandom(seed: number): () => number {
  let state = seed;

  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
