import { UserTier } from '$lib/domains/shared/types.js';
import { isDev } from '$lib/domains/shared/utils/is-dev.util.js';
import { type User } from '$lib/domains/shared/user/domain/user.js';

class UserState {
  private _user = $state<User>();

  get user(): User {
    return this._user;
  }

  get tier(): User['tier'] {
    return this._user?.tier || UserTier.FREE;
  }

  get id(): User['id'] {
    return this._user?.id;
  }

  // todo: this should be a domain value object
  humanReadableTier(tier: UserTier): string {
    return tier.replace('-', ' ');
  }

  get isPaid(): boolean {
    return this.tier !== UserTier.FREE && this.tier !== UserTier.EARLY_USER;
  }

  get hasBilling(): boolean {
    return this.isPaid && this.tier !== UserTier.CONTRIBUTOR;
  }

  get isFree(): boolean {
    return this.tier === UserTier.FREE || this.tier === UserTier.EARLY_USER;
  }

  get avatar(): User['avatarUrl'] {
    return this._user?.avatarUrl;
  }

  get hasEarlyAccess(): boolean {
    return (
      this.tier === UserTier.EARLY_BIRD ||
      this.tier === UserTier.BUILDER ||
      this.tier === UserTier.PRO ||
      isDev()
    );
  }

  get canUpgrade(): boolean {
    return (
      this.tier === UserTier.FREE ||
      this.tier === UserTier.CONTRIBUTOR ||
      this.tier === UserTier.EARLY_USER ||
      this.tier === UserTier.EARLY_BIRD ||
      this.tier === UserTier.BUILDER
    );
  }

  set(user: User): void {
    this._user = user;
  }
}

export const userState = new UserState();
