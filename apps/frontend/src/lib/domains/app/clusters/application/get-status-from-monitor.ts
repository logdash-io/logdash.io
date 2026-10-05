import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings.js';
import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';

import type { ServiceStatus } from '$lib/domains/app/clusters/domain/service-status.js';

export type { ServiceStatus };

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

  if (
    monitor.lastStatus === 'unknown' ||
    monitor.lastStatusCode === undefined
  ) {
    return 'unknown';
  }

  const isHealthy =
    monitor.lastStatusCode >= 200 && monitor.lastStatusCode < 400;

  // todo: make sure we get enough data from BE to show degraded here upfront
  return isHealthy ? 'up' : 'down';
}
