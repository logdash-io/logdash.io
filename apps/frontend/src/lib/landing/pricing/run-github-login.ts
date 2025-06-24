import { UserTier } from '$lib/shared/types.js';
import { generateGithubOAuthUrl } from '$lib/shared/utils/generate-github-oauth-url.js';
import { match } from 'ts-pattern';

export const runGithubLogin = (tier: UserTier) => {
  window.location.href = generateGithubOAuthUrl({
    terms_accepted: false,
    email_accepted: false,
    flow: 'login',
    fallback_url: `/app/auth?needs_account=true`,
    tier,
    next_url: match(tier)
      .with(UserTier.EARLY_BIRD, () => '/app/api/user/upgrade')
      .otherwise(() => '/app/clusters'),
  });
};
