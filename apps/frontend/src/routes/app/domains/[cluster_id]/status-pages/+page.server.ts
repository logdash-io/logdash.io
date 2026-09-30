import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { PageServerLoad } from './$types';
import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard';

export const load: PageServerLoad = async ({
  cookies,
  params,
}): Promise<{
  dashboards: PublicDashboard[];
}> => {
  const dashboards = await logdashAPI.get_public_dashboards(
    params.cluster_id,
    get_access_token(cookies),
  );

  return {
    dashboards: dashboards ?? [],
  };
};
