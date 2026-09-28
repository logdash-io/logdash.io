import { formatUptime } from '@logdash/hyper-ui/features/public-dashboard/utils/format-status-page';
import type { Bucket, Monitor, StatusPage } from '@logdash/status';
import { createContext } from 'svelte';

export type DayStatus = 'up' | 'degraded' | 'down' | 'none';

export type UptimeWindow = '24h' | '7d' | '30d' | '90d';

export type SkinProps = {
  page: StatusPage;
};

export type DayLabels = {
  uptime: (percent: string) => string;
  checks: (count: string, latencyMs: string | null) => string;
  empty: string;
};

export type LensLabels = {
  page: Record<StatusPage['status'], string>;
  monitor: Record<Monitor['status'], string>;
  uptime: Record<UptimeWindow, string>;
  updated: string;
  since: (days: number) => string;
  today: string;
  day?: DayLabels;
};

export type LensHover = {
  monitor: string | null;
  day: number | null;
};

export const [getLensHover, setLensHover] = createContext<LensHover>();

export const DEFAULT_DAY_LABELS: DayLabels = {
  uptime: (percent) => `${percent} uptime`,
  checks: (count, latencyMs) =>
    latencyMs === null
      ? `${count} checks`
      : `${count} checks · ${latencyMs} ms avg`,
  empty: 'No checks this day',
};

export const UPTIME_WINDOWS: UptimeWindow[] = ['24h', '7d', '30d', '90d'];

export const DEFAULT_LABELS: LensLabels = {
  page: {
    operational: 'All systems operational',
    degraded: 'Partial outage',
    outage: 'Major outage',
    unknown: 'Status unknown',
  },
  monitor: {
    up: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    unknown: 'Unknown',
  },
  uptime: {
    '24h': '24 h uptime',
    '7d': '7 d uptime',
    '30d': '30 d uptime',
    '90d': '90 d uptime',
  },
  updated: 'Checked every minute',
  since: (days) => `${days} days ago`,
  today: 'Today',
  day: DEFAULT_DAY_LABELS,
};

export function dayUptime(day: Bucket): number | null {
  const checks = day.successCount + day.failureCount;

  return checks ? (day.successCount / checks) * 100 : null;
}

export function dayStatus(day: Bucket): DayStatus {
  const uptime = dayUptime(day);

  if (uptime === null) return 'none';
  if (uptime < 50) return 'down';

  return uptime < 99.9 ? 'degraded' : 'up';
}

export function describeHistory(monitor: Monitor): string {
  return `${monitor.name}, ${monitor.history.daily.length} days, ${formatUptime(monitor.uptime['90d'])} uptime`;
}

export { formatUptime };
