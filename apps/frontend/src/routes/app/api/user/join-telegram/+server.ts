import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';

export const GET: RequestHandler = async ({ cookies }) => {
	const data = await logdashAPI.get_telegram_invite_link(
		get_access_token(cookies),
	);

	return json({
		status: 200,
		data: data.url,
	});
};
