import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{ userCode: string }> => {
  const accessToken = get_access_token(event.cookies);
  const userCode = event.url.searchParams.get('user_code') ?? '';

  if (!accessToken) {
    const redirectTarget = `/app/authorize-cli?user_code=${encodeURIComponent(
      userCode,
    )}`;
    throw redirect(
      302,
      `/app/auth?redirect=${encodeURIComponent(redirectTarget)}`,
    );
  }

  return { userCode };
};
