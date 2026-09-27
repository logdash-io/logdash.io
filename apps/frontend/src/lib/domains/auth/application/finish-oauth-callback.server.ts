import { claimAnonymousAccount } from '$lib/domains/auth/application/claim-anonymous-account.server';
import type { OAuthFailureReason } from '$lib/domains/auth/domain/oauth-popup-message';
import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import { loginWithOAuth } from '$lib/domains/auth/infrastructure/oauth-exchange.server';
import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import {
  needsOnboarding,
  onboardingUrl,
} from '$lib/domains/onboarding/application/needs-onboarding';
import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import {
  save_access_token,
  save_onboarding_tier,
} from '$lib/domains/shared/utils/cookies.utils';
import { tokenMaxAge } from '$lib/domains/shared/utils/jwt.utils';
import {
  consume_oauth_state,
  type OAuthStatePayload,
} from '$lib/domains/shared/utils/oauth-state.server';
import { safe_redirect_path } from '$lib/domains/shared/utils/safe-redirect.util';
import type { Cookies } from '@sveltejs/kit';

const SIGNED_IN_URL = '/app/clusters';
const POPUP_RESULT_URL = '/app/auth/popup';

type CallbackResult =
  | { kind: 'signed-in'; token: string; nextUrl: string }
  | { kind: 'failed'; reason: OAuthFailureReason; flow: 'login' | 'claim' };

export const finishOAuthCallback = async (dto: {
  url: URL;
  cookies: Cookies;
  provider: OAuthProvider;
}): Promise<string> => {
  const { url, cookies, provider } = dto;
  const state = consume_oauth_state(cookies, url.searchParams.get('state'));

  if (!state) {
    bffLogger.error(
      `${provider} oauth callback with missing or mismatched state`,
    );

    return failedUrl({ kind: 'failed', reason: 'login-failed', flow: 'login' });
  }

  const result = await exchangeCode({
    cookies,
    provider,
    code: url.searchParams.get('code'),
    state,
  });

  if (result.kind === 'signed-in' && state.tier) {
    save_onboarding_tier(cookies, state.tier);
  }

  if (state.popup) {
    return popupResultUrl(result);
  }

  if (result.kind === 'failed') {
    return failedUrl(result, state);
  }

  return signedInUrl(result);
};

const exchangeCode = async (dto: {
  cookies: Cookies;
  provider: OAuthProvider;
  code: string | null;
  state: OAuthStatePayload;
}): Promise<CallbackResult> => {
  const { cookies, provider, code, state } = dto;

  if (state.flow === 'claim') {
    const outcome = await claimAnonymousAccount(dto);

    if (outcome.kind === 'claimed') {
      return { ...outcome, kind: 'signed-in' };
    }

    if (outcome.kind === 'failed') {
      return { ...outcome, flow: 'claim' };
    }
  }

  if (!code) {
    bffLogger.error(`${provider} login callback without a provider code`);

    return { kind: 'failed', reason: 'login-failed', flow: 'login' };
  }

  try {
    bffLogger.info(`logging in with ${provider}...`);

    const { token } = await loginWithOAuth(provider, code);
    const maxAge = tokenMaxAge(token);

    if (!maxAge) {
      bffLogger.error(`${provider} login returned an unusable token`);

      return { kind: 'failed', reason: 'login-failed', flow: 'login' };
    }

    save_access_token(cookies, token, { maxAge });

    bffLogger.info(`${provider} login success`);

    return {
      kind: 'signed-in',
      token,
      nextUrl: safe_redirect_path(state.next_url, SIGNED_IN_URL),
    };
  } catch (error) {
    bffLogger.error(`${provider} login failed ${String(error)}`);

    return { kind: 'failed', reason: 'login-failed', flow: 'login' };
  }
};

const signedInUrl = async (
  result: Extract<CallbackResult, { kind: 'signed-in' }>,
): Promise<string> => {
  const session = await readSessionUser(result.token);

  if (session.kind === 'ok' && needsOnboarding(session.user)) {
    return onboardingUrl(result.nextUrl);
  }

  return result.nextUrl;
};

const failedUrl = (
  result: Extract<CallbackResult, { kind: 'failed' }>,
  state?: OAuthStatePayload,
): string => {
  const params = new URLSearchParams({
    ...(result.flow === 'claim' && { flow: 'claim' }),
    error: result.reason,
    ...(state && { next_url: state.next_url }),
    ...(state?.tier && { tier: state.tier }),
  });

  return `/app/auth?${params.toString()}`;
};

const popupResultUrl = (result: CallbackResult): string => {
  const params = new URLSearchParams(
    result.kind === 'signed-in'
      ? { status: 'ok' }
      : { status: 'error', reason: result.reason },
  );

  return `${POPUP_RESULT_URL}?${params.toString()}`;
};
