import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import { InitialMonitorsDataPreloader } from '$lib/domains/app/projects/infrastructure/data-preloaders/initial-monitors.data-preloader.js';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader.js';

export const load = async (
  event,
): Promise<{
  initialMonitors: Monitor[];
}> => {
  return {
    ...(await resolve_data_preloader(InitialMonitorsDataPreloader)(event)),
  };
};
