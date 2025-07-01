import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import type { Project } from '$lib/domains/app/projects/domain/project.js';
import { logdashAPI } from '$lib/domains/shared/logdash.api.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({
  url,
}: ServerLoadEvent): Promise<{
  projectId: Project['id'];
  clusterId: Cluster['id'];
}> => {
  const projectId = url.searchParams.get('project_id');
  const demoProject = await logdashAPI.get_demo_project_config();

  if (!projectId || projectId !== demoProject.projectId) {
    redirect(302, `/demo-dashboard?project_id=${demoProject.projectId}`);
  }

  return demoProject;
};
