import type { Log } from '$lib/domains/logs/domain/log.js';
import type { Metric } from '$lib/domains/app/projects/domain/metric.js';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import { InitialLogsDataPreloader } from '$lib/domains/logs/infrastructure/initial-logs.data-preloader.js';
import { InitialMetricsDataPreloader } from '$lib/domains/app/projects/infrastructure/data-preloaders/initial-metrics.data-preloader.js';
import { InitialMonitorsDataPreloader } from '$lib/domains/app/projects/infrastructure/data-preloaders/initial-monitors.data-preloader.js';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader.js';

export const load = async (
  event,
): Promise<{
  initialLogs: Log[];
  initialMetrics: Metric[];
  initialMonitors: Monitor[];
}> => {
  return {
    ...(await resolve_data_preloader(InitialLogsDataPreloader)(event)),
    ...(await resolve_data_preloader(InitialMetricsDataPreloader)(event)),
    ...(await resolve_data_preloader(InitialMonitorsDataPreloader)(event)),
  };
};
