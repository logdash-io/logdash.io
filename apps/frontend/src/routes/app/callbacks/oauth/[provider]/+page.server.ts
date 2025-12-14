import { dev } from '$app/environment';
import { bffLogger } from '$lib/domains/shared/bff-logger';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import {
  get_access_token,
  save_access_token,
  save_onboarding_tier,
} from '$lib/domains/shared/utils/cookies.utils';
import type { GoogleCallbackState } from '$lib/domains/shared/utils/generate-google-oauth-url';
import {
  isRedirect,
  redirect,
  type Cookies,
  type ServerLoadEvent,
} from '@sveltejs/kit';

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
    maxAge: expiration.getTime() - Date.now(),
  });
}

async function runLoginFlow(dto: {
  cookies: Cookies;
  code: string | null;
  state: GoogleCallbackState;
  forceLocalLogin: boolean;
}): Promise<void> {
  const {
    cookies,
    code,
    forceLocalLogin,
    state: { terms_accepted, email_accepted, next_url },
  } = dto;

  if (!code) {
    throw new Error('code is required');
  }

  bffLogger.info(`logging in google ${code}...`);

  const response = await fetch(`${envConfig.apiBaseUrl}/auth/google/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      googleCode: code,
      termsAccepted: terms_accepted,
      emailAccepted: email_accepted,
      forceLocalLogin,
    }),
  });

  if (!response.ok) {
    const error = await readErrorMessage(response);
    throw new Error(`google login error: ${error}`);
  }

  const { token } = (await response.json()) as { token: string };

  saveTokenToCookies({
    cookies,
    token,
  });

  redirect(302, next_url || `/app/clusters`);
}

async function runClaimFlow(dto: {
  cookies: Cookies;
  code: string | null;
  state: GoogleCallbackState;
  forceLocalLogin: boolean;
}): Promise<void> {
  const {
    cookies,
    code,
    forceLocalLogin,
    state: { cluster_id, email_accepted, next_url },
  } = dto;

  if (!cluster_id) {
    throw new Error('cluster_id is required for claiming');
  }

  if (!code) {
    throw new Error('code is required');
  }

  const anon_access_token = get_access_token(cookies);

  if (!anon_access_token) {
    throw new Error('anon access token is required for claiming');
  }

  bffLogger.info(`claiming google ${JSON.stringify({ code })}...`);

  const response = await fetch(`${envConfig.apiBaseUrl}/auth/google/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      googleCode: code,
      accessToken: anon_access_token,
      emailAccepted: email_accepted,
      forceLocalLogin,
    }),
  });

  if (!response.ok) {
    const error = await readErrorMessage(response);
    throw new Error(`google claim error: ${error}`);
  }

  const { token } = (await response.json()) as { token: string };

  saveTokenToCookies({
    cookies,
    token,
  });

  redirect(302, next_url || `/app/clusters`);
}

export const load = async ({
  url,
  cookies,
  params,
}: ServerLoadEvent): Promise<void> => {
  if (!['google', 'google-alternative'].includes(params.provider)) {
    redirect(302, '/');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  bffLogger.debug(
    `google oauth callback ${JSON.stringify({ code, state, provider: params.provider })}`,
  );

  let decodedState: GoogleCallbackState;
  try {
    if (!state) {
      throw new Error('state is required');
    }
    decodedState = JSON.parse(atob(state)) as GoogleCallbackState;
  } catch (error) {
    bffLogger.error(`google oauth callback state decode error ${error}`);
    redirect(302, '/');
  }

  if (decodedState.tier) {
    save_onboarding_tier(cookies, decodedState.tier);
  }

  try {
    const forceLocalLogin = dev || params.provider === 'google-alternative';
    if (decodedState.flow === 'login') {
      await runLoginFlow({
        cookies,
        code,
        state: decodedState,
        forceLocalLogin,
      });
    } else if (decodedState.flow === 'claim') {
      await runClaimFlow({
        cookies,
        code,
        state: decodedState,
        forceLocalLogin,
      });
    }
  } catch (result) {
    if (isRedirect(result)) {
      throw result;
    }

    bffLogger.error(`google oauth callback error ${result}`);
    redirect(302, decodedState.fallback_url || '/');
  }
};
