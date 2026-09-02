import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import {
  ClaimAccountError,
  claimAccount,
} from '$lib/domains/auth/infrastructure/oauth-claim.server';
import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import {
  clear_onboarding_tier,
  get_access_token,
  save_access_token,
} from '$lib/domains/shared/utils/cookies.utils';
import { tokenMaxAge } from '$lib/domains/shared/utils/jwt.utils';
import type { OAuthStatePayload } from '$lib/domains/shared/utils/oauth-state.server';
import { safe_redirect_path } from '$lib/domains/shared/utils/safe-redirect.util';
import type { Cookies } from '@sveltejs/kit';

const CLAIMED_URL = '/app/clusters?claimed=1';

type ClaimErrorCode = 'project-limit' | 'unavailable' | 'claim-failed';

export type OAuthClaimOutcome =
  | { kind: 'redirect'; redirectTo: string }
  | { kind: 'login' };

export const claimAnonymousAccount = async (dto: {
  cookies: Cookies;
  provider: OAuthProvider;
  code: string | null;
  state: OAuthStatePayload;
}): Promise<OAuthClaimOutcome> => {
  const { cookies, provider, code, state } = dto;

  if (!code) {
    bffLogger.error(`claim callback without a provider code`);

    return failedClaim(cookies, 'claim-failed');
  }

  const accessToken = get_access_token(cookies);

  if (!accessToken) {
    bffLogger.info(`claim callback without a session, falling back to login`);

    return { kind: 'login' };
  }

  const session = await readSessionUser(accessToken);

  if (session.kind === 'unavailable') {
    bffLogger.error(
      `claim callback could not verify the session, leaving it untouched`,
    );

    return failedClaim(cookies, 'unavailable');
  }

  if (session.kind !== 'ok') {
    bffLogger.info(
      `claim callback with an ${session.kind} session, falling back to login`,
    );

    return { kind: 'login' };
  }

  if (session.user.accountClaimStatus !== 'anonymous') {
    bffLogger.info(
      `claim callback for an already claimed session, falling back to login`,
    );

    return { kind: 'login' };
  }

  bffLogger.info(`claiming ${provider} account...`);

  return runClaim({ cookies, provider, code, accessToken, state });
};

const runClaim = async (dto: {
  cookies: Cookies;
  provider: OAuthProvider;
  code: string;
  accessToken: string;
  state: OAuthStatePayload;
}): Promise<OAuthClaimOutcome> => {
  const { cookies, provider, code, accessToken, state } = dto;

  try {
    const { token } = await claimAccount(provider, {
      code,
      accessToken,
      termsAccepted: state.terms_accepted,
      emailAccepted: state.email_accepted,
    });

    const maxAge = tokenMaxAge(token);

    if (!maxAge) {
      bffLogger.error(`${provider} claim returned an unusable token`);

      return failedClaim(cookies, 'claim-failed');
    }

    save_access_token(cookies, token, { maxAge });

    bffLogger.info(`${provider} claim success`);

    return {
      kind: 'redirect',
      redirectTo: safe_redirect_path(state.next_url, CLAIMED_URL),
    };
  } catch (error) {
    if (error instanceof ClaimAccountError && error.status === 409) {
      bffLogger.error(
        `${provider} claim rejected, target account is at its project limit`,
      );

      return failedClaim(cookies, 'project-limit');
    }

    bffLogger.error(`${provider} claim failed ${error}`);

    return failedClaim(cookies, 'claim-failed');
  }
};

const failedClaim = (
  cookies: Cookies,
  code: ClaimErrorCode,
): OAuthClaimOutcome => {
  clear_onboarding_tier(cookies);

  return { kind: 'redirect', redirectTo: `/app/auth?flow=claim&error=${code}` };
};
