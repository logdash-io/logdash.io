import { startOAuthLogin } from '$lib/domains/auth/application/start-oauth-login.js';
import { UserTier } from '$lib/domains/shared/types.js';

export const runGithubLogin = (tier: UserTier): Promise<void> => {
  // the tier travels in the server-side oauth state and is turned into a
  // stripe checkout redirect once the user lands in /app/clusters
  return startOAuthLogin({
    provider: 'github',
    terms_accepted: false,
    email_accepted: false,
    tier,
    next_url: '/app/clusters',
  });
};
