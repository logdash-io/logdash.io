import { finishOAuthCallback } from '$lib/domains/auth/application/finish-oauth-callback.server';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({
  url,
  cookies,
}: ServerLoadEvent): Promise<void> => {
  redirect(
    302,
    await finishOAuthCallback({ url, cookies, provider: 'github' }),
  );
};
