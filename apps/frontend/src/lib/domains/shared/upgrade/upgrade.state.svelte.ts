import type { UpgradeSource } from './start-tier-upgrade.util.js';

class UpgradeState {
  private _modalVisible = $state(false);
  private _source = $state<UpgradeSource>('unknown');

  get modalOpen(): boolean {
    return this._modalVisible;
  }

  get source(): UpgradeSource {
    return this._source;
  }

  openModal(source: UpgradeSource = 'unknown'): void {
    this._source = source;
    this._modalVisible = true;
  }

  hideModal(): void {
    this._modalVisible = false;
  }
}

export const upgradeState = new UpgradeState();
