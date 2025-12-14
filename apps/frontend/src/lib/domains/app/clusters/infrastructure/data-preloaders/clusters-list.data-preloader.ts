import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';

export class ClustersListDataPreloader implements DataPreloader<{
  clusters: Cluster[];
}> {
  async preload({
    cookies,
  }: ServerLoadEvent): Promise<{ clusters: Cluster[] }> {
    const clusters =
      (await logdashAPI.get_user_clusters(get_access_token(cookies))) || [];

    return { clusters };
  }
}
