import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const link = await logdashAPI.stripe_billing_portal(
		get_access_token(cookies),
	);

	redirect(302, link.customerPortalUrl);
};
