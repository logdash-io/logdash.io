import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { PageServerLoad } from './$types';
import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard';

export const load: PageServerLoad = async ({
  cookies,
  params,
}): Promise<{
  dashboard: PublicDashboard | null;
  clusterId: string;
}> => {
  const clusterId = params.cluster_id;

  if (!clusterId) {
    throw new Error('Cluster id is required');
  }

  const dashboards = await logdashAPI.get_public_dashboards(
    clusterId,
    get_access_token(cookies),
  );

  return {
    dashboard: dashboards?.[0] ?? null,
    clusterId,
  };
};
