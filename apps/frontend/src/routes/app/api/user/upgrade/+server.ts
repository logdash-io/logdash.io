import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bffLogger } from '$lib/shared/bff-logger.js';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const source = url.searchParams.get('source') || 'unknown';

  // Log the upgrade source for analytics
  bffLogger.info(`[UPGRADE] User initiated upgrade from source: ${source}`);

  const link = await logdashAPI.stripe_checkout(get_access_token(cookies));

  redirect(302, link.checkoutUrl);
};
