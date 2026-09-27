import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import { ClustersListDataPreloader } from '$lib/domains/app/clusters/infrastructure/data-preloaders/clusters-list.data-preloader';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader';
import {
  needsOnboarding,
  onboardingUrl,
} from '$lib/domains/onboarding/application/needs-onboarding';
import { checkoutUrl } from '$lib/domains/shared/upgrade/checkout-url.server';
import { UserTier } from '$lib/domains/shared/types.js';
import { UserDataPreloader } from '$lib/domains/shared/user/infrastructure/data-preloaders/user.data-preloader';
import {
  clear_onboarding_tier,
  get_access_token,
  get_onboarding_tier,
} from '$lib/domains/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{
  clusters: Cluster[];
}> => {
  const onboardingTier = get_onboarding_tier(event.cookies);
  const user = await resolve_data_preloader(UserDataPreloader)(event);

  if (needsOnboarding(user.user)) {
    redirect(
      302,
      onboardingUrl(event.untrack(() => event.url.pathname + event.url.search)),
    );
  }

  if (onboardingTier === UserTier.BUILDER || onboardingTier === UserTier.PRO) {
    // cleared first: a checkout that fails must not fail every dashboard load
    // for as long as the cookie lives
    clear_onboarding_tier(event.cookies);

    const url = await checkoutUrl(
      get_access_token(event.cookies),
      onboardingTier,
    );

    if (url) {
      redirect(302, url);
    }
  }

  return {
    ...(await resolve_data_preloader(ClustersListDataPreloader)(event)),
    ...user,
  };
};
