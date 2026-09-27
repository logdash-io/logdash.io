import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import type { UserTier } from '$lib/domains/shared/types';

/**
 * The Stripe checkout for `tier`, or null when it cannot start: Stripe is
 * down, or the user already pays and must change plans instead.
 */
export const checkoutUrl = async (
  token: string | undefined,
  tier: UserTier,
): Promise<string | null> => {
  try {
    return (await logdashAPI.stripe_checkout(token, tier)).checkoutUrl;
  } catch (error) {
    bffLogger.error(`checkout for ${tier} failed ${String(error)}`);

    return null;
  }
};
