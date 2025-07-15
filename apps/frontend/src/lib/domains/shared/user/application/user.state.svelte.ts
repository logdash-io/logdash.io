import { UserTier } from '$lib/domains/shared/types.js';
import { isDev } from '$lib/domains/shared/utils/is-dev.util.js';
import { type User } from '$lib/domains/shared/user/domain/user.js';
import {
  startTierUpgrade,
  type UpgradeSource,
} from '../../upgrade/start-tier-upgrade.util.js';
import { posthog } from 'posthog-js';
import { UsersService } from '../infrastructure/users.service.js';
import { match } from 'ts-pattern';
import { toast } from '../../ui/toaster/toast.state.svelte.js';

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

  get isPro(): boolean {
    return this.tier === UserTier.PRO;
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

  get canSetupCustomDomain(): boolean {
    return this.isPro;
  }

  set(user: User): void {
    this._user = user;
  }

  get nextUpgradeTier(): UserTier | null {
    return match(this.tier)
      .with(UserTier.FREE, () => UserTier.BUILDER)
      .with(UserTier.EARLY_USER, () => UserTier.BUILDER)
      .with(UserTier.CONTRIBUTOR, () => UserTier.BUILDER)
      .with(UserTier.EARLY_BIRD, () => UserTier.BUILDER)
      .with(UserTier.BUILDER, () => UserTier.PRO)
      .otherwise(() => null);
  }

  upgrade(source: UpgradeSource, _to?: UserTier): UserTier | null {
    const to = _to ?? this.nextUpgradeTier;

    if (!to) {
      throw new Error('No next upgrade tier found');
    }

    if (!this.hasBilling) {
      startTierUpgrade(source, to);
    } else {
      UsersService.changePaidPlan(to)
        .then(() => {
          toast.success('Your plan has been upgraded!');
          this.set({ ...this._user, tier: to });
        })
        .catch((error) => {
          toast.error('Failed to upgrade your plan');
          console.error(error);
        });
    }

    return to;
  }
}

export const userState = new UserState();
