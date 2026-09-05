import { dev } from '$app/environment';
import { claimAnonymousAccount } from '$lib/domains/auth/application/claim-anonymous-account.server';
import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import { isLocal } from '$lib/domains/shared/utils/is-dev.util';
import {
  save_access_token,
  save_onboarding_tier,
} from '$lib/domains/shared/utils/cookies.utils';
import {
  consume_oauth_state,
  type OAuthStatePayload,
} from '$lib/domains/shared/utils/oauth-state.server';
import { safe_redirect_path } from '$lib/domains/shared/utils/safe-redirect.util';
import {
  isRedirect,
  redirect,
  type Cookies,
  type ServerLoadEvent,
} from '@sveltejs/kit';

const FALLBACK_URL = '/app/auth?needs_account=true';

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      return JSON.stringify(message);
    }
    return JSON.stringify(body);
  }

  return response.text();
}

function saveTokenToCookies(dto: { cookies: Cookies; token: string }): void {
  const expiration = new Date(
    JSON.parse(atob(dto.token.split('.')[1])).exp * 1000,
  );

  save_access_token(dto.cookies, dto.token, {
    maxAge: Math.floor((expiration.getTime() - Date.now()) / 1000),
  });
}

async function runLoginFlow(dto: {
  cookies: Cookies;
  code: string | null;
  state: OAuthStatePayload;
}): Promise<void> {
  const {
    cookies,
    code,
    state: { terms_accepted, email_accepted, next_url },
  } = dto;

  if (!code) {
    throw new Error('code is required');
  }

  bffLogger.info(`logging in google...`, {
    termsAccepted: terms_accepted,
    emailAccepted: email_accepted,
  });

  const response = await fetch(`${envConfig.apiBaseUrl}/auth/google/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      googleCode: code,
      termsAccepted: terms_accepted,
      emailAccepted: email_accepted,
    }),
  });

  if (!response.ok) {
    bffLogger.error(
      `google code exchange response not ok`,
      response.statusText,
    );
    const error = await readErrorMessage(response);
    throw new Error(`google login error: ${error}`);
  }

  bffLogger.info(`google code exchange response ok, extracting token...`);
  const { token } = (await response.json()) as { token: string };

  bffLogger.info(`saving token to cookies...`);
  saveTokenToCookies({
    cookies,
    token,
  });

  bffLogger.info(`redirecting to next url...`);

  redirect(302, safe_redirect_path(next_url, '/app/clusters'));
}

export const load = async ({
  url,
  cookies,
  params,
}: ServerLoadEvent): Promise<void> => {
  const allowedProviders =
    isLocal() || dev ? ['google', 'google-alternative'] : ['google'];

  if (!allowedProviders.includes(params.provider)) {
    redirect(302, '/');
  }

  const code = url.searchParams.get('code');
  const state = consume_oauth_state(cookies, url.searchParams.get('state'));

  if (!state) {
    bffLogger.error(`google oauth callback with missing or mismatched state`);
    redirect(302, FALLBACK_URL);
  }

  if (state.tier) {
    save_onboarding_tier(cookies, state.tier);
  }

  try {
    if (state.flow === 'claim') {
      const outcome = await claimAnonymousAccount({
        cookies,
        provider: 'google',
        code,
        state,
      });

      if (outcome.kind === 'redirect') {
        redirect(302, outcome.redirectTo);
      }
    }

    await runLoginFlow({
      cookies,
      code,
      state,
    });
  } catch (result) {
    if (isRedirect(result)) {
      throw result;
    }

    bffLogger.error(`google oauth callback error ${result}`);
    redirect(302, FALLBACK_URL);
  }
};
