import type { Project } from '$lib/clusters/projects/domain/project';
import type { DataPreloader } from '$lib/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';

export class ProjectsListDataPreloader
	implements DataPreloader<{ projects: Project[] }>
{
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
