import { envConfig } from '$lib/domains/shared/utils/env-config';

export const generateGoogleOAuthUrl = (
  state: string,
  options: { redirectUri: string },
): string => {
  const params = new URLSearchParams({
    client_id: envConfig.google.clientId,
    redirect_uri: options.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
