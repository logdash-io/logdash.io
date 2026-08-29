import { envConfig } from '$lib/domains/shared/utils/env-config';

export const generateGithubOAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: envConfig.github.clientId,
    scope: 'read:user,user:email',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};
