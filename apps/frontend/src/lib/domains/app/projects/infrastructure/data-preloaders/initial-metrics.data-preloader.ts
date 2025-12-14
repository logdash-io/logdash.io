import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Metric } from '$lib/domains/app/projects/domain/metric.js';

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
