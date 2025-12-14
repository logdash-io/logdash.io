import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';

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
      (await logdashAPI.get_monitors(params.cluster_id, get_access_token(cookies))) || [];

    return { initialMonitors };
  }
}
