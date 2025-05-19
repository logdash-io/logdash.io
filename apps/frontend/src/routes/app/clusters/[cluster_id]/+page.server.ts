import type { Log } from '$lib/clusters/projects/domain/log.js';
import type { Metric } from '$lib/clusters/projects/domain/metric.js';
import { InitialLogsDataPreloader } from '$lib/clusters/projects/infrastructure/data-preloaders/initial-logs.data-preloader.js';
import { InitialMetricsDataPreloader } from '$lib/clusters/projects/infrastructure/data-preloaders/initial-metrics.data-preloader.js';
import { resolve_data_preloader } from '$lib/shared/data-preloader/resolve-data-preloader.js';

export const load = async (
	event,
): Promise<{
	initialLogs: Log[];
	initialMetrics: Metric[];
}> => {
	return {
		...(await resolve_data_preloader(InitialLogsDataPreloader)(event)),
		...(await resolve_data_preloader(InitialMetricsDataPreloader)(event)),
	};
};
