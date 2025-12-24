import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  params,
}): Promise<{
  clusterId: string;
  statusPageId: string;
}> => {
  const clusterId = params.cluster_id;
  const statusPageId = params.status_page_id;

  if (!clusterId) {
    throw new Error('Cluster id is required');
  }

  if (!statusPageId) {
    throw new Error('Status page id is required');
  }

  return {
    clusterId,
    statusPageId,
  };
};
