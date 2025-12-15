import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bffLogger } from '$lib/domains/shared/bff-logger.server.js';
import { UserTier } from '$lib/domains/shared/types.js';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const source = url.searchParams.get('source') || 'unknown';
  const tier = url.searchParams.get('tier') || 'builder';

  // Log the upgrade source for analytics
  bffLogger.info(`[UPGRADE] User initiated upgrade from source: ${source}`);

  if (!Object.values(UserTier).includes(tier as UserTier)) {
    return new Response('Invalid tier', { status: 400 });
  }

  const link = await logdashAPI.stripe_checkout(
    get_access_token(cookies),
    tier as UserTier,
  );

  redirect(302, link.checkoutUrl);
};
