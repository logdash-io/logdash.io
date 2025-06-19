import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({
  cookies,
  params,
}: ServerLoadEvent): Promise<{
  dashboard_id: string;
}> => {
  const clusterId = params.cluster_id;

  if (!clusterId) {
    throw new Error('Cluster id is required');
  }

  let dashboards = await logdashAPI.get_public_dashboards(
    clusterId,
    get_access_token(cookies),
  );

  if (!dashboards || dashboards.length === 0) {
    const newDashboard = await logdashAPI.create_public_dashboard(
      clusterId,
      get_access_token(cookies),
    );
    dashboards = [newDashboard];
  }

  return {
    dashboard_id: dashboards[0].id,
  };
};
