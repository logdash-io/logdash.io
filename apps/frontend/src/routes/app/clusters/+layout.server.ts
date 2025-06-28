import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
import { ClustersListDataPreloader } from '$lib/clusters/clusters/infrastructure/data-preloaders/clusters-list.data-preloader';
import { resolve_data_preloader } from '$lib/shared/data-preloader/resolve-data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api.js';
import { UserTier } from '$lib/shared/types.js';
import { UserDataPreloader } from '$lib/shared/user/infrastructure/data-preloaders/user.data-preloader';
import {
  clear_onboarding_tier,
  get_access_token,
  get_onboarding_tier,
} from '$lib/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{
  clusters: Cluster[];
}> => {
  const { url } = event;
  const onboardingTier = get_onboarding_tier(event.cookies);
  const user = await resolve_data_preloader(UserDataPreloader)(event);

  if (
    user.user.accountClaimStatus === 'anonymous' &&
    !url.pathname.includes('/setup')
  ) {
    return redirect(302, '/app/auth');
  }

  if (onboardingTier === UserTier.EARLY_BIRD) {
    const link = await logdashAPI.stripe_checkout(
      get_access_token(event.cookies),
    );
    clear_onboarding_tier(event.cookies);

    return redirect(302, link.checkoutUrl);
  }

  return {
    ...(await resolve_data_preloader(ClustersListDataPreloader)(event)),
    ...user,
  };
};
