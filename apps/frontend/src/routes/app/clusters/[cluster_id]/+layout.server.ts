import type { Project } from '$lib/domains/app/projects/domain/project.js';
import { ProjectsListDataPreloader } from '$lib/domains/app/projects/infrastructure/data-preloaders/projects-list.data-preloader.js';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader';
import { type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{
  projects: Project[];
}> => {
  return {
    ...(await resolve_data_preloader(ProjectsListDataPreloader)(event)),
  };
};
