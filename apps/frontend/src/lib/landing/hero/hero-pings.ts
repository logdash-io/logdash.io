import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings';
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

/** Share of healthy checks, e.g. "100%" or "96.7%". Null before the first check. */
export function uptimeLabel(pings: ChartPing[]): string | null {
  if (!pings.length) {
    return null;
  }

  const share = (pings.filter(isHealthy).length / pings.length) * 100;

  return `${Number(share.toFixed(1))}%`;
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
