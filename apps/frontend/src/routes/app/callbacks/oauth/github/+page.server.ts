import { claimAnonymousAccount } from '$lib/domains/auth/application/claim-anonymous-account.server';
import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
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

async function runLoginFlow(dto: {
  cookies: Cookies;
  code: string | null;
  state: OAuthStatePayload;
}): Promise<void> {
  const {
    code,
    cookies,
    state: { terms_accepted, email_accepted, next_url },
  } = dto;

  bffLogger.info(`logging in github...`);

  const { error, access_token } = await logdashAPI.github_login({
    code,
    terms_accepted,
    email_accepted,
  });

  if (error) {
    throw new Error(`github login error: ${error}`);
  }

  bffLogger.info(`github login success`);
  const expiration = new Date(
    JSON.parse(atob(access_token.split('.')[1])).exp * 1000,
  );

  save_access_token(cookies, access_token, {
    maxAge: Math.floor((expiration.getTime() - Date.now()) / 1000),
  });

  redirect(302, safe_redirect_path(next_url, '/app/clusters'));
}

export const load = async ({
  url,
  cookies,
}: ServerLoadEvent): Promise<void> => {
  const code = url.searchParams.get('code');
  const state = consume_oauth_state(cookies, url.searchParams.get('state'));

  if (!state) {
    bffLogger.error(`github oauth callback with missing or mismatched state`);
    redirect(302, FALLBACK_URL);
  }

  if (state.tier) {
    save_onboarding_tier(cookies, state.tier);
  }

  try {
    if (state.flow === 'claim') {
      const outcome = await claimAnonymousAccount({
        cookies,
        provider: 'github',
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

    bffLogger.error(`github oauth callback error ${result}`);
    redirect(302, FALLBACK_URL);
  }
};
