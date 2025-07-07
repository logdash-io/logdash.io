import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({
  cookies,
  params,
}: ServerLoadEvent): Promise<{
  project_id: string;
  api_key: string;
}> => {
  const clusterId = params.cluster_id;
  if (!clusterId) {
    throw new Error('Cluster ID is required');
  }
  const projects = await logdashAPI.get_cluster_projects(
    clusterId,
    get_access_token(cookies),
  );
  if (!projects) {
    throw new Error('Projects not found');
  }
  const { id: projectId } = projects[0];
  const [project_api_key] = await logdashAPI.get_project_api_keys(
    get_access_token(cookies),
    projectId,
  );

  return {
    project_id: projectId,
    api_key: project_api_key,
  };
};
