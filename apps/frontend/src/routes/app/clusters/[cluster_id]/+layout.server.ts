import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import type { Project } from '$lib/domains/app/projects/domain/project.js';
import { InitialMonitorsDataPreloader } from '$lib/domains/app/projects/infrastructure/data-preloaders/initial-monitors.data-preloader.js';
import { ProjectsListDataPreloader } from '$lib/domains/app/projects/infrastructure/data-preloaders/projects-list.data-preloader.js';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader';
import { error, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{
  projects: Project[];
  initialMonitors: Monitor[];
}> => {
  try {
    const [projects, monitors] = await Promise.all([
      resolve_data_preloader(ProjectsListDataPreloader)(event),
      resolve_data_preloader(InitialMonitorsDataPreloader)(event),
    ]);

    return { ...projects, ...monitors };
  } catch (cause) {
    const { clusters } = (await event.parent()) as { clusters: Cluster[] };

    if (!clusters.some(({ id }) => id === event.params.cluster_id)) {
      error(404, 'Project not found');
    }

    throw cause;
  }
};
