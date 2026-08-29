import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

/**
 * Deliberately ignores every query parameter. The user code is NOT accepted from
 * the URL: a pre-filled code turns the "does this match your terminal?" check
 * into a rubber stamp, which is exactly what a phishing link exploits. The user
 * types the code they can see in their own terminal (ADR-0003 invariant #3).
 */
export const load = async (event: ServerLoadEvent): Promise<void> => {
  const accessToken = get_access_token(event.cookies);

  if (!accessToken) {
    throw redirect(
      302,
      `/app/auth?redirect=${encodeURIComponent('/app/authorize-cli')}`,
    );
  }
};
