import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';

export const GET: RequestHandler = async ({ cookies }) => {
	const data = await logdashAPI.get_me(get_access_token(cookies));

	return json({
		status: 200,
		data,
	});
};
