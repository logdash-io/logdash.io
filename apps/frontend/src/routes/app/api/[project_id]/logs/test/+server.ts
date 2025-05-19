import { logdashAPI } from '$lib/shared/logdash.api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { get_access_token } from '$lib/shared/utils/cookies.utils.js';

export const POST: RequestHandler = async ({
	params,
	getClientAddress,
	cookies,
}) => {
	if (!params.project_id) {
		return json({
			status: 400,
			error: 'Project ID is required',
		});
	}

	await logdashAPI.send_test_log(
		params.project_id,
		getClientAddress(),
		get_access_token(cookies),
	);

	return json({
		status: 200,
	});
};
