import { dev } from '$app/environment';
import { finishOAuthCallback } from '$lib/domains/auth/application/finish-oauth-callback.server';
import { isLocal } from '$lib/domains/shared/utils/is-dev.util';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoadEvent } from './$types';

export const load = async ({
  url,
  cookies,
  params,
}: PageServerLoadEvent): Promise<void> => {
  const allowedProviders =
    isLocal() || dev ? ['google', 'google-alternative'] : ['google'];

  if (!allowedProviders.includes(params.provider)) {
    error(404, 'Unknown oauth provider');
  }

  redirect(
    302,
    await finishOAuthCallback({ url, cookies, provider: 'google' }),
  );
};
