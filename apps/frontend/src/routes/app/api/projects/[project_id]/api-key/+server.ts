import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
	const [apiKey] = await logdashAPI.get_project_api_keys(
		get_access_token(cookies),
		params.project_id,
	);

	return json({
		status: 200,
		data: apiKey,
	});
};
