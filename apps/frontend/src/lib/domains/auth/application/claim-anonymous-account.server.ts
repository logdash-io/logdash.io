import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import {
  ClaimAccountError,
  claimAccount,
} from '$lib/domains/auth/infrastructure/oauth-claim.server';
import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import {
  get_access_token,
  save_access_token,
} from '$lib/domains/shared/utils/cookies.utils';
import { decodeJwtPayload } from '$lib/domains/shared/utils/jwt.utils';
import type { OAuthStatePayload } from '$lib/domains/shared/utils/oauth-state.server';
import { safe_redirect_path } from '$lib/domains/shared/utils/safe-redirect.util';
import type { Cookies } from '@sveltejs/kit';

const CLAIMED_URL = '/app/clusters?claimed=1';
const PROJECT_LIMIT_URL = '/app/auth?flow=claim&error=project-limit';

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
    throw new Error('code is required');
  }

  const accessToken = get_access_token(cookies);

  if (!accessToken) {
    bffLogger.info(`claim callback without a session, falling back to login`);

    return { kind: 'login' };
  }

  const session = await readSessionUser(accessToken);

  if (session.kind !== 'ok') {
    bffLogger.info(
      `claim callback with an unusable session (${session.kind}), falling back to login`,
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

  try {
    const { token } = await claimAccount(provider, {
      code,
      accessToken,
      termsAccepted: state.terms_accepted,
      emailAccepted: state.email_accepted,
    });

    saveClaimedToken(cookies, token);

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

      return { kind: 'redirect', redirectTo: PROJECT_LIMIT_URL };
    }

    throw error;
  }
};

const saveClaimedToken = (cookies: Cookies, token: string): void => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    throw new Error('claimed token is malformed');
  }

  const maxAge = payload.exp - Math.floor(Date.now() / 1000);

  if (maxAge <= 0) {
    throw new Error('claimed token is already expired');
  }

  save_access_token(cookies, token, { maxAge });
};
