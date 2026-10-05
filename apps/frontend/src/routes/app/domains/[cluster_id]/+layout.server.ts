import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
import {
  DOMAIN_SETUP_COOKIE,
  DOMAIN_SETUP_COOKIE_MAX_AGE,
  parseDomainSetups,
  serializeDomainSetups,
} from '$lib/domains/app/clusters/domain/domain-setup';
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
  setupOpen: boolean;
}> => {
  const setupOpen = readSetupOpen(event);

  try {
    const [projects, monitors] = await Promise.all([
      resolve_data_preloader(ProjectsListDataPreloader)(event),
      resolve_data_preloader(InitialMonitorsDataPreloader)(event),
    ]);

    return { ...projects, ...monitors, setupOpen };
  } catch (cause) {
    const { clusters } = (await event.parent()) as { clusters: Cluster[] };

    if (!clusters.some(({ id }) => id === event.params.cluster_id)) {
      error(404, 'Domain not found');
    }

    throw cause;
  }
};

function readSetupOpen({ cookies, params, url }: ServerLoadEvent): boolean {
  const clusterId = params.cluster_id ?? '';
  const open = parseDomainSetups(cookies.get(DOMAIN_SETUP_COOKIE));

  if (open.includes(clusterId)) {
    return true;
  }

  if (url.searchParams.get('claimed') !== '1') {
    return false;
  }

  cookies.set(
    DOMAIN_SETUP_COOKIE,
    serializeDomainSetups([...open, clusterId]),
    {
      path: '/app',
      maxAge: DOMAIN_SETUP_COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: 'lax',
    },
  );

  return true;
}
