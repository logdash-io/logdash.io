import { dev } from '$app/environment';
import type { UserTier } from '$lib/domains/shared/types.js';
import { envConfig } from '$lib/domains/shared/utils/env-config';

export type GoogleCallbackState = {
  terms_accepted: boolean;
  email_accepted: boolean;
  flow: 'login';
  fallback_url: string;
  tier?: UserTier;
  next_url: string;
};

export const generateGoogleOAuthUrl = (
  state: GoogleCallbackState,
  options?: { redirectUri?: string },
): string => {
  const redirectUri =
    options?.redirectUri ||
    (dev
      ? 'http://localhost:5173/app/callbacks/oauth/google-alternative'
      : `${window.location.origin}/app/callbacks/oauth/google`);

  const params = new URLSearchParams({
    client_id: envConfig.google.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: btoa(JSON.stringify(state || {})),
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('url', url);
  return url;
};
