import { MonitorStatus } from './enums/monitor-status.enum';

export const RECENT_PINGS_COUNT = 10;

const isHealthy = (statusCode: number): boolean => statusCode >= 200 && statusCode < 400;

export function getMonitorStatus(pingsNewestFirst: { statusCode: number }[]): MonitorStatus {
  const recentPings = pingsNewestFirst.slice(0, RECENT_PINGS_COUNT);

  if (recentPings.length === 0) {
    return MonitorStatus.Unknown;
  }

  if (!isHealthy(recentPings[0].statusCode)) {
    return MonitorStatus.Down;
  }

  if (recentPings.some((ping) => !isHealthy(ping.statusCode))) {
    return MonitorStatus.Degraded;
  }

  return MonitorStatus.Up;
}
