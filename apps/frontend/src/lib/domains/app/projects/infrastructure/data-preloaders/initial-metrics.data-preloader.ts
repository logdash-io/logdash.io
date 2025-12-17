import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Metric } from '$lib/domains/app/projects/domain/metric.js';

export class InitialMetricsDataPreloader
  implements
    DataPreloader<{
      initialMetrics: Metric[];
    }>
{
  async preload({
    cookies,
    params,
  }: ServerLoadEvent): Promise<{ initialMetrics: Metric[] }> {
    const projectId = params.project_id;

    if (!projectId) {
      return {
        initialMetrics: [],
      };
    }

    const initialMetrics =
      (await logdashAPI.get_project_metrics(
        projectId,
        get_access_token(cookies),
      )) || [];

    return { initialMetrics };
  }
}
