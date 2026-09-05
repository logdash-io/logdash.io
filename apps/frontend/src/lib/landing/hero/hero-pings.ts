import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';

export type ChartPing = {
  createdAt: string;
  statusCode: number;
  responseTimeMs: number;
};

export type MonitorStatus = ReturnType<typeof getStatusFromPings>;

export function toChartPings(pings: HttpPing[]): ChartPing[] {
  return pings
    .map((ping) => ({
      createdAt: new Date(ping.createdAt).toISOString(),
      statusCode: ping.statusCode,
      responseTimeMs: ping.responseTimeMs,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function statusFromHttpPings(pings: HttpPing[]): MonitorStatus {
  return getStatusFromPings(toChartPings(pings));
}
