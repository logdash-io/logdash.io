import type { Cookies } from '@sveltejs/kit';
import type { UserTier } from '$lib/domains/shared/types.js';

export const PROJECT_ID_COOKIE_NAME = 'logdash_project_id';
export const API_KEY_COOKIE_NAME = 'logdash_api_key';
export const ACCESS_TOKEN_COOKIE_NAME = 'logdash_access_token_v0';
/**
 * The session token is only ever needed under /app, so it is not attached to
 * landing pages or to the /ingest analytics proxy.
 */
export const ACCESS_TOKEN_COOKIE_PATH = '/app';

export const get_api_key = (cookies: Cookies): string | undefined => {
  return cookies.get('logdash_api_key');
};

export const save_project_id = (cookies: Cookies, project_id: string): void => {
  cookies.set('logdash_project_id', project_id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const get_project_id = (cookies: Cookies): string | undefined => {
  return cookies.get('logdash_project_id');
};

export const save_access_token = (
  cookies: Cookies,
  access_token: string,
  options?: {
    maxAge?: number;
  },
): void => {
  cookies.set(ACCESS_TOKEN_COOKIE_NAME, access_token, {
    path: ACCESS_TOKEN_COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 7,
    // TODO: the browser data layer (http-client + the SSE streams) still calls
    // the api directly with this token, so it cannot be httpOnly until those
    // calls are proxied through the /app/api bff.
    httpOnly: false,
    ...options,
  });
};

export const get_access_token = (cookies: Cookies): string | undefined => {
  return cookies.get(ACCESS_TOKEN_COOKIE_NAME);
};

export const clear_access_token = (cookies: Cookies): void => {
  cookies.delete(ACCESS_TOKEN_COOKIE_NAME, {
    path: ACCESS_TOKEN_COOKIE_PATH,
  });
};

export const save_onboarding_tier = (
  cookies: Cookies,
  tier: UserTier,
): void => {
  cookies.set('logdash_onboarding_tier', tier, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const get_onboarding_tier = (cookies: Cookies): UserTier | undefined => {
  return cookies.get('logdash_onboarding_tier') as UserTier;
};

export const clear_onboarding_tier = (cookies: Cookies): void => {
  cookies.delete('logdash_onboarding_tier', {
    path: '/',
  });
};
