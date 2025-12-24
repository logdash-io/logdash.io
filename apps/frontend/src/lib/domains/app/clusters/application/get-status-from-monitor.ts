import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings.js';
import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';

export type ServiceStatus = 'up' | 'down' | 'degraded' | 'unknown';

export function getStatusFromMonitor(
  monitor: Monitor | undefined,
): ServiceStatus {
  if (!monitor) {
    return 'unknown';
  }

  const pings = monitoringState.monitoringPings(monitor.id);
  if (pings.length > 0) {
    return getStatusFromPings(pings);
  }

  if (monitor.lastStatusCode === undefined) {
    return 'unknown';
  }

  const isHealthy =
    monitor.lastStatusCode >= 200 && monitor.lastStatusCode < 400;

  // todo: make sure we get enough data from BE to show degraded here upfront
  return isHealthy ? 'up' : 'down';
}
