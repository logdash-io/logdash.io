import type { UpgradeSource } from './start-tier-upgrade.util.js';

class UpgradeState {
  private _modalVisible = $state(false);
  private _backgroundVisible = $state(false);
  private _hideBackgroundTimeout: ReturnType<typeof setTimeout> | null = null;
  private _source = $state<UpgradeSource>('unknown');

  get modalOpen(): boolean {
    return this._modalVisible;
  }

  get backgroundVisible(): boolean {
    return this._backgroundVisible;
  }

  get source(): UpgradeSource {
    return this._source;
  }

  showBackground(): void {
    if (this._hideBackgroundTimeout) {
      clearTimeout(this._hideBackgroundTimeout);
      this._hideBackgroundTimeout = null;
    }
    this._backgroundVisible = true;
  }

  hideBackground(): void {
    this._hideBackgroundTimeout = setTimeout(() => {
      this._backgroundVisible = false;
      this._hideBackgroundTimeout = null;
    }, 200);
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
