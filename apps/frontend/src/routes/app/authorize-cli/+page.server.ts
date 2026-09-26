import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import {
  needsOnboarding,
  onboardingUrl,
} from '$lib/domains/onboarding/application/needs-onboarding';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

const AUTHORIZE_CLI_PATH = '/app/authorize-cli';

/**
 * Deliberately ignores every query parameter. The user code is NOT accepted from
 * the URL: a pre-filled code turns the "does this match your terminal?" check
 * into a rubber stamp, which is exactly what a phishing link exploits. The user
 * types the code they can see in their own terminal (ADR-0003 invariant #3).
 */
export const load = async (event: ServerLoadEvent): Promise<void> => {
  const accessToken = get_access_token(event.cookies);

  if (!accessToken) {
    redirect(
      302,
      `/app/auth?next_url=${encodeURIComponent(AUTHORIZE_CLI_PATH)}`,
    );
  }

  const session = await readSessionUser(accessToken);

  if (session.kind === 'ok' && needsOnboarding(session.user)) {
    redirect(302, onboardingUrl(AUTHORIZE_CLI_PATH));
  }
};
