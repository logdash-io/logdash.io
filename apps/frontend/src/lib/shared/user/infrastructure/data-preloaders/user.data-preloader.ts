import type { DataPreloader } from '$lib/shared/data-preloader/data-preloader';
import { logdashAPI } from '$lib/shared/logdash.api';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { User } from '../../domain/user';

export class UserDataPreloader implements DataPreloader<{ user: User }> {
	async preload({ cookies }: ServerLoadEvent): Promise<{ user: User }> {
		const user = await logdashAPI.get_me(get_access_token(cookies));

		return { user };
	}
}
