import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Log } from '$lib/domains/logs/domain/log.js';

export class InitialLogsDataPreloader
  implements
    DataPreloader<{
      initialLogs: Log[];
    }>
{
  async preload({
    cookies,
    url,
    params,
  }: ServerLoadEvent): Promise<{ initialLogs: Log[] }> {
    const projectId = params.project_id || url.searchParams.get('project_id');

    if (!projectId) {
      return {
        initialLogs: [],
      };
    }

    const initialLogs =
      (await logdashAPI.get_project_logs(
        projectId,
        get_access_token(cookies),
      )) || [];

    return { initialLogs };
  }
}
