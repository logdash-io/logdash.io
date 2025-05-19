import type { DataPreloader } from '$lib/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Log } from '../../domain/log.js';

export class InitialLogsDataPreloader
	implements DataPreloader<{ initialLogs: Log[] }>
{
	async preload({
		cookies,
		params,
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
