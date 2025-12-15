import type { Project } from '$lib/domains/app/projects/domain/project';
import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';

export class ProjectsListDataPreloader implements DataPreloader<{
  projects: Project[];
}> {
  async preload({
    cookies,
    params,
  }: ServerLoadEvent): Promise<{ projects: Project[] }> {
    const projects =
      (await logdashAPI.get_cluster_projects(
        params.cluster_id,
        get_access_token(cookies),
      )) || [];

    return { projects };
  }
}
