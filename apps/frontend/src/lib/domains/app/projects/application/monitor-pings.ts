import { getStatusFromPings } from './get-status-from-pings';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';

export type ChartPing = {
  createdAt: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
};

export type MonitorStatus = ReturnType<typeof getStatusFromPings>;

export function toChartPings(pings: HttpPing[]): ChartPing[] {
  return pings
    .map((ping) => ({
      createdAt: new Date(ping.createdAt).toISOString(),
      statusCode: ping.statusCode,
      responseTimeMs: ping.responseTimeMs,
      message: ping.message,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function statusFromHttpPings(pings: HttpPing[]): MonitorStatus {
  return getStatusFromPings(toChartPings(pings));
}

const isHealthy = (ping: ChartPing): boolean =>
  ping.statusCode >= 200 && ping.statusCode < 400;

export function responseTimes(pings: ChartPing[]): number[] {
  return pings.map((ping) =>
    isHealthy(ping) ? Math.max(1, ping.responseTimeMs) : 0,
  );
}

export function noResponseReason(ping: ChartPing | undefined): string | null {
  if (!ping || ping.statusCode) {
    return null;
  }

  return ping.message ?? 'No response';
}

export function lastCheckLabel(pings: ChartPing[], now: number): string | null {
  const last = pings.at(-1);

  if (!last) {
    return null;
  }

  const seconds = Math.max(
    0,
    Math.floor((now - Date.parse(last.createdAt)) / 1_000),
  );

  if (seconds < 5) {
    return 'Just now';
  }

  return seconds < 60
    ? `${seconds} s ago`
    : `${Math.floor(seconds / 60)} min ago`;
}

export function uptimePercent(pings: ChartPing[]): number | null {
  if (!pings.length) {
    return null;
  }

  return (pings.filter(isHealthy).length / pings.length) * 100;
}

/** The gap the monitor actually keeps between checks, e.g. "15 s" or "1 min". */
export function checkIntervalLabel(pings: ChartPing[]): string | null {
  // A new monitor is checked once on creation and then on its schedule, so the
  // gap after the first check says nothing about the cadence. Leave it out.
  const gaps = pings
    .slice(2)
    .map(
      (ping, index) =>
        Date.parse(ping.createdAt) - Date.parse(pings[index + 1].createdAt),
    )
    .sort((a, b) => a - b);

  if (!gaps.length) {
    return null;
  }

  const seconds = Math.round(gaps[Math.floor(gaps.length / 2)] / 1_000);

  return seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`;
}

export function cronIntervalLabel(cron: string | null): string | null {
  const fields = cron?.trim().split(/\s+/) ?? [];
  const step = /^\*\/(\d+)$/.exec(fields[0] ?? '')?.[1];

  if (!step) {
    return null;
  }

  return fields.length === 6 ? `${Number(step)} s` : `${Number(step)} min`;
}

export function checkingLabel(interval: string | null): string {
  return interval ? `Checking every ${interval}` : 'Scheduled checks';
}

export type MonitorStat = {
  label: string;
  value: string;
};

export function monitorStats(
  pings: ChartPing[],
  uptime: MonitorStat,
): MonitorStat[] {
  const last = pings.at(-1);
  const answered = last?.statusCode ? last : null;

  return [
    {
      label: 'Response',
      value: answered ? `${answered.responseTimeMs} ms` : '--',
    },
    { label: 'Status', value: answered ? `${answered.statusCode}` : '--' },
    uptime,
  ];
}
