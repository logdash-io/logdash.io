import { logdashAPI } from '$lib/shared/logdash.api.js';
import { get_access_token } from '$lib/shared/utils/cookies.utils.js';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const monitors = await logdashAPI.get_monitors(
		params.cluster_id,
		get_access_token(cookies),
	);

	return json({
		success: true,
		data: monitors,
	});
};
