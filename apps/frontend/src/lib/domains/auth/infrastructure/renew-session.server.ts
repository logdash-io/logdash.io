import type { Cookies } from '@sveltejs/kit';
import type { User } from '$lib/domains/shared/user/domain/user';
import { save_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { tokenMaxAge } from '$lib/domains/shared/utils/jwt.utils';

const RENEW_BELOW_SECONDS = 60 * 60 * 24 * 5;

export const renewSessionIfNeeded = async (
  cookies: Cookies,
  token: string,
  user: User,
  apiBaseUrl: string,
): Promise<void> => {
  if (user.accountClaimStatus !== 'claimed') {
    return;
  }

  const remaining = tokenMaxAge(token);

  if (!remaining || remaining > RENEW_BELOW_SECONDS) {
    return;
  }

  const renewed = await requestRenewedToken(token, apiBaseUrl);

  if (!renewed) {
    return;
  }

  const maxAge = tokenMaxAge(renewed);

  if (maxAge) {
    save_access_token(cookies, renewed, { maxAge });
  }
};

const requestRenewedToken = async (
  token: string,
  apiBaseUrl: string,
): Promise<string | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}/users/me/token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { token?: string };

    return body.token ?? null;
  } catch {
    return null;
  }
};
