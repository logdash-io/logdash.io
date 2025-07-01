import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const logs = await logdashAPI.get_project_log_metrics(
		params.project_id,
		get_access_token(cookies),
	);

	return json({
		status: 200,
		data: logs,
	});
};
