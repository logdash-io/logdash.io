import { UserTier } from '$lib/domains/shared/types.js';
import { generateGithubOAuthUrl } from '$lib/domains/shared/utils/generate-github-oauth-url.js';
import { match } from 'ts-pattern';

export const runGithubLogin = (tier: UserTier) => {
  window.location.href = generateGithubOAuthUrl({
    terms_accepted: false,
    email_accepted: false,
    flow: 'login',
    fallback_url: `/app/auth?needs_account=true`,
    tier,
    next_url: match(tier)
      .with(
        UserTier.BUILDER,
        () => '/app/api/user/upgrade?source=pricing-page&tier=builder',
      )
      .with(
        UserTier.PRO,
        () => '/app/api/user/upgrade?source=pricing-page&tier=pro',
      )
      .otherwise(() => '/app/clusters'),
  });
};
