import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({
	cookies,
	params,
	url,
}: ServerLoadEvent): Promise<{
	project_id: string;
	api_key: string;
}> => {
	const projectId = url.searchParams.get('project_id');
	const clusterId = params.cluster_id;
	if (!clusterId) {
		throw new Error('Cluster id is required');
	}
	const projects = await logdashAPI.get_cluster_projects(
		clusterId,
		get_access_token(cookies),
	);
	const desiredProject = projects.find((project) => project.id === projectId);
	if (!desiredProject) {
		throw new Error('Project not found in the cluster');
	}
	if (!projects) {
		throw new Error('Projects not found');
	}
	const [project_api_key] = await logdashAPI.get_project_api_keys(
		get_access_token(cookies),
		desiredProject.id,
	);

	return {
		project_id: desiredProject.id,
		api_key: project_api_key,
	};
};
