import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import { needsOnboarding } from '$lib/domains/onboarding/application/needs-onboarding';
import type { User } from '$lib/domains/shared/user/domain/user';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { safe_redirect_path } from '$lib/domains/shared/utils/safe-redirect.util';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoadEvent } from './$types';

export const load = async ({
  cookies,
  url,
}: PageServerLoadEvent): Promise<{ user: User; nextUrl: string }> => {
  const nextUrl = safe_redirect_path(
    url.searchParams.get('next_url'),
    '/app/clusters',
  );
  const token = get_access_token(cookies);

  if (!token) {
    redirect(302, '/app/auth');
  }

  const session = await readSessionUser(token);

  if (session.kind === 'unavailable') {
    error(503, 'Session check is unavailable');
  }

  if (session.kind !== 'ok' || session.user.accountClaimStatus !== 'claimed') {
    redirect(302, '/app/auth');
  }

  if (!needsOnboarding(session.user)) {
    redirect(302, nextUrl);
  }

  return { user: session.user, nextUrl };
};
