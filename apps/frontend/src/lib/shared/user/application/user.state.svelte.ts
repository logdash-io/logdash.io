import { UserTier } from '$lib/shared/types.js';
import { isDev } from '$lib/shared/utils/is-dev.util.js';
import { type User } from '../domain/user.js';

class UserState {
	private _user = $state<User>();

	get user(): User {
		return this._user;
	}

	get tier(): User['tier'] {
		return this._user?.tier || UserTier.FREE;
	}

	get avatar(): User['avatarUrl'] {
		return this._user?.avatarUrl;
	}

	get hasEarlyAccess(): boolean {
		return this.tier === UserTier.EARLY_BIRD || isDev();
	}

	set(user: User): void {
		this._user = user;
	}
}

export const userState = new UserState();
