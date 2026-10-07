import type { UserTier } from '../types.js';
import type { UpgradeSource } from './start-tier-upgrade.util.js';

class UpgradeState {
  private _modalVisible = $state(false);
  private _source = $state<UpgradeSource>('unknown');
  private _requiredTier = $state<UserTier | null>(null);

  get modalOpen(): boolean {
    return this._modalVisible;
  }

  get source(): UpgradeSource {
    return this._source;
  }

  get requiredTier(): UserTier | null {
    return this._requiredTier;
  }

  public openModal(
    source: UpgradeSource = 'unknown',
    requiredTier: UserTier | null = null,
  ): void {
    this._source = source;
    this._requiredTier = requiredTier;
    this._modalVisible = true;
  }

  public hideModal(): void {
    this._modalVisible = false;
  }
}

export const upgradeState = new UpgradeState();
