import { formatUptime } from '@logdash/hyper-ui/features/public-dashboard/utils/format-status-page';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import type { PingBucketPeriod } from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
import { displayUrl, isNameFromUrl } from '../../../../shared/utils/url';
import {
  checkIntervalLabel,
  lastCheckLabel,
  monitorStats,
  noResponseReason,
  responseTimes,
  uptimePercent,
  type ChartPing,
  type MonitorStat,
} from '../../application/monitor-pings';
import { MonitorMode } from '../../domain/monitoring/monitor-mode';

export type MonitorPanelContent = {
  eyebrow: string;
  eyebrowHref?: string;
  title: string;
  notice: string | null;
  stats: MonitorStat[];
  responseTimes: number[];
  checkingLabel: string;
  lastCheckLabel: string;
};

type MonitorReading = {
  monitor: Monitor;
  pings: ChartPing[];
  bucketUptime: number | null;
  range: PingBucketPeriod;
  now: number;
  loaded: boolean;
  failed?: boolean;
};

export function monitorPanelContent({
  monitor,
  pings,
  bucketUptime,
  range,
  now,
  loaded,
  failed = false,
}: MonitorReading): MonitorPanelContent {
  const url = checkedUrl(monitor);
  const uptime = bucketUptime ?? uptimePercent(pings);
  const interval = checkIntervalLabel(pings);

  return {
    eyebrow: url ? displayUrl(url) : modeLabel(monitor.mode),
    eyebrowHref: url,
    title: monitor.name,
    notice: noResponseReason(pings.at(-1)),
    stats: monitorStats(pings, {
      label: uptimeLabel(bucketUptime, range),
      value: uptime === null ? '--' : formatUptime(uptime),
    }),
    responseTimes: responseTimes(pings),
    checkingLabel: interval ? `Checking every ${interval}` : 'Checking',
    lastCheckLabel:
      lastCheckLabel(pings, now) ?? emptyCheckLabel(loaded, failed),
  };
}

function uptimeLabel(
  bucketUptime: number | null,
  range: PingBucketPeriod,
): string {
  if (bucketUptime === null) {
    return 'Recent uptime';
  }

  return range === '90h' ? '90-hour uptime' : '90-day uptime';
}

function emptyCheckLabel(loaded: boolean, failed: boolean): string {
  if (failed) {
    return 'Could not load checks';
  }

  return loaded ? 'Waiting for the first check' : 'Loading checks';
}

function checkedUrl(monitor: Monitor): string | undefined {
  if (monitor.mode !== MonitorMode.PULL || !monitor.url) {
    return undefined;
  }

  return isNameFromUrl(monitor.name, monitor.url) ? undefined : monitor.url;
}

function modeLabel(mode: MonitorMode): string {
  return mode === MonitorMode.PUSH ? 'Heartbeat monitor' : 'Live monitor';
}
