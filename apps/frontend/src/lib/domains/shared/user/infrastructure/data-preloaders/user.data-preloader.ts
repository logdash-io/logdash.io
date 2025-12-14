import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { User } from '$lib/domains/shared/user/domain/user';

export class UserDataPreloader implements DataPreloader<{ user: User }> {
  async preload({ cookies }: ServerLoadEvent): Promise<{ user: User }> {
    const user = await logdashAPI.get_me(get_access_token(cookies));

    return { user };
  }
}
