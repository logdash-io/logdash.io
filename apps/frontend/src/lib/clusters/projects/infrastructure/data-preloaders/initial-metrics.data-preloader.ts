import type { DataPreloader } from '$lib/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Metric } from '../../domain/metric.js';

export class InitialMetricsDataPreloader
	implements DataPreloader<{ initialMetrics: Metric[] }>
{
	async preload({
		cookies,
		params,
		url,
	}: ServerLoadEvent): Promise<{ initialMetrics: Metric[] }> {
		if (!url.searchParams.has('project_id')) {
			return {
				initialMetrics: [],
			};
		}

		const initialMetrics =
			(await logdashAPI.get_project_metrics(
				url.searchParams.get('project_id'),
				get_access_token(cookies),
			)) || [];

		return { initialMetrics };
	}
}
