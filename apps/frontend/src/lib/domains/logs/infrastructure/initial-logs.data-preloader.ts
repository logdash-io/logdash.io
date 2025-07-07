import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Log } from '$lib/domains/logs/domain/log.js';

export class InitialLogsDataPreloader
  implements DataPreloader<{ initialLogs: Log[] }>
{
  async preload({
    cookies,
    url,
  }: ServerLoadEvent): Promise<{ initialLogs: Log[] }> {
    if (!url.searchParams.has('project_id')) {
      return {
        initialLogs: [],
      };
    }

    const initialLogs =
      (await logdashAPI.get_project_logs(
        url.searchParams.get('project_id'),
        get_access_token(cookies),
      )) || [];

    return { initialLogs };
  }
}
