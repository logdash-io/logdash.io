import type { UserTier } from '$lib/domains/shared/types.js';
import { envConfig } from '$lib/domains/shared/utils/env-config';

export type GithubCallbackState = {
  terms_accepted: boolean;
  email_accepted: boolean;
  flow: 'claim' | 'login';
  fallback_url: string;
  cluster_id?: string;
  tier?: UserTier;
  next_url: string;
};

export const generateGithubOAuthUrl = (state: GithubCallbackState) => {
  return `https://github.com/login/oauth/authorize?client_id=${envConfig.github.clientId}&scope=read:user,user:email&state=${btoa(
    JSON.stringify(state || {}),
  )}`;
};
