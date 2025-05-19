import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
import type { DataPreloader } from '$lib/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';

export class ClustersListDataPreloader
	implements DataPreloader<{ clusters: Cluster[] }>
{
	async preload({
		cookies,
	}: ServerLoadEvent): Promise<{ clusters: Cluster[] }> {
		const clusters =
			(await logdashAPI.get_user_clusters(get_access_token(cookies))) ||
			[];

		return { clusters };
	}
}
