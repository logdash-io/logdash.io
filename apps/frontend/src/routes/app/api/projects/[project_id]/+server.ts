import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ cookies, params, url }) => {
	await logdashAPI.delete_project(
		params.project_id,
		get_access_token(cookies),
	);

	return json({
		success: true,
	});
};
