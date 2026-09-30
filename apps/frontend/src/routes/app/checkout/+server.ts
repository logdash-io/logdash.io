import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import { HERO_URL_INPUT_ID } from '$lib/landing/hero/hero-anchors';
import { trialTier } from '$lib/domains/shared/payment-plans.const';
import { checkoutUrl } from '$lib/domains/shared/upgrade/checkout-url.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const tier = trialTier(url.searchParams.get('tier'));
  const token = get_access_token(cookies);

  if (!tier) {
    redirect(303, `/#${HERO_URL_INPUT_ID}`);
  }

  const session = token ? await readSessionUser(token) : null;

  if (
    session?.kind === 'ok' &&
    session.user.accountClaimStatus !== 'anonymous'
  ) {
    // no checkout (a plan already paid for, or Stripe down) lands in the app
    redirect(303, (await checkoutUrl(token, tier)) ?? '/app/domains');
  }

  redirect(303, `/?tier=${tier}#${HERO_URL_INPUT_ID}`);
};
