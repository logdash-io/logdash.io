import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
	const metrics = await logdashAPI.get_metric_details(
		params.project_id,
		url.searchParams.get('metric_id'),
		get_access_token(cookies),
	);

	return json({
		status: 200,
		data: metrics,
	});
};
