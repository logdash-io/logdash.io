import type { DataPreloader } from '$lib/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Monitor } from '../../domain/monitoring/monitor.js';

export class InitialMonitorsDataPreloader
  implements DataPreloader<{ initialMonitors: Monitor[] }>
{
  async preload({
    cookies,
    params,
  }: ServerLoadEvent): Promise<{ initialMonitors: Monitor[] }> {
    if (!params.cluster_id) {
      return {
        initialMonitors: [],
      };
    }

    const initialMonitors =
      (await logdashAPI.get_monitors(
        params.cluster_id,
        get_access_token(cookies),
      )) || [];

    return { initialMonitors };
  }
}
