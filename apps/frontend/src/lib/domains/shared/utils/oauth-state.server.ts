import type { UserTier } from '$lib/domains/shared/types.js';
import type { Cookies } from '@sveltejs/kit';

export const OAUTH_STATE_COOKIE_NAME = 'logdash_oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;

/**
 * Everything the oauth callback needs to finish a login. It lives in a
 * short-lived, httpOnly cookie instead of the `state` query param so that the
 * provider round trip cannot be tampered with (login CSRF, forged consent
 * flags, open redirects).
 */
export type OAuthStatePayload = {
  state: string;
  terms_accepted: boolean;
  email_accepted: boolean;
  next_url: string;
  tier?: UserTier;
  flow?: 'login' | 'claim';
};

export const save_oauth_state = (
  cookies: Cookies,
  payload: OAuthStatePayload,
): void => {
  cookies.set(OAUTH_STATE_COOKIE_NAME, JSON.stringify(payload), {
    path: '/app',
    maxAge: OAUTH_STATE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
  });
};

/**
 * Reads and clears the pending oauth state, returning it only when it matches
 * the `state` the provider echoed back.
 */
export const consume_oauth_state = (
  cookies: Cookies,
  state: string | null,
): OAuthStatePayload | null => {
  const stored = cookies.get(OAUTH_STATE_COOKIE_NAME);

  cookies.delete(OAUTH_STATE_COOKIE_NAME, { path: '/app' });

  if (!stored || !state) {
    return null;
  }

  try {
    const payload = JSON.parse(stored) as OAuthStatePayload;

    if (!payload?.state || payload.state !== state) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
