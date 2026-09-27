import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import {
  clear_access_token,
  get_access_token,
} from '$lib/domains/shared/utils/cookies.utils';
import { isRedirect, redirect, type ServerLoadEvent } from '@sveltejs/kit';
import type { User } from '$lib/domains/shared/user/domain/user';

const EXPIRED_SESSION_STATUSES = [401, 404];

const isExpiredSession = (error: unknown): boolean => {
  if (isRedirect(error)) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.startsWith('Unauthorized') ||
    EXPIRED_SESSION_STATUSES.some((status) =>
      error.message.includes(`HTTP error ${status}`),
    )
  );
};

export class UserDataPreloader implements DataPreloader<{ user: User }> {
  async preload({ cookies }: ServerLoadEvent): Promise<{ user: User }> {
    try {
      const user = await logdashAPI.get_me(get_access_token(cookies));

      return { user };
    } catch (error) {
      if (!isExpiredSession(error)) {
        throw error;
      }

      clear_access_token(cookies);

      return redirect(302, '/app/auth?expired=1');
    }
  }
}
