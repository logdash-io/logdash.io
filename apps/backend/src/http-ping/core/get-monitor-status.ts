import { MonitorStatus } from './enums/monitor-status.enum';

export const RECENT_PINGS_COUNT = 10;

export const FAILED_PINGS_TO_CONFIRM_DOWN = 2;

export const isHealthy = (statusCode: number): boolean => statusCode >= 200 && statusCode < 400;

export function getMonitorStatus(pingsNewestFirst: { statusCode: number }[]): MonitorStatus {
  const recentPings = pingsNewestFirst.slice(0, RECENT_PINGS_COUNT);

  if (recentPings.length === 0) {
    return MonitorStatus.Unknown;
  }

  const latestPings = recentPings.slice(0, FAILED_PINGS_TO_CONFIRM_DOWN);

  if (
    latestPings.length === FAILED_PINGS_TO_CONFIRM_DOWN &&
    latestPings.every((ping) => !isHealthy(ping.statusCode))
  ) {
    return MonitorStatus.Down;
  }

  if (recentPings.some((ping) => !isHealthy(ping.statusCode))) {
    return MonitorStatus.Degraded;
  }

  return MonitorStatus.Up;
}
