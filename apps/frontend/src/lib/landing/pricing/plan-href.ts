import { resolve } from '$app/paths';
import { trialTier } from '$lib/domains/shared/payment-plans.const';
import type { UserTier } from '$lib/domains/shared/types';
import { HERO_URL_INPUT_ID } from '$lib/landing/hero/hero-anchors';

export const planHref = (tier: UserTier): string => {
  const trial = trialTier(tier);

  return trial
    ? `${resolve('/app/checkout')}?tier=${trial}`
    : `${resolve('/')}#${HERO_URL_INPUT_ID}`;
};
