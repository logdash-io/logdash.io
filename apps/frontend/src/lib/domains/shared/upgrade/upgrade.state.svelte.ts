class UpgradeState {
  private _modalVisible = $state(false);
  private _backgroundVisible = $state(false);
  private _hideBackgroundTimeout: ReturnType<typeof setTimeout> | null = null;

  get modalOpen(): boolean {
    return this._modalVisible;
  }

  get backgroundVisible(): boolean {
    return this._backgroundVisible;
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

  openModal(): void {
    this._modalVisible = true;
  }

  hideModal(): void {
    this._modalVisible = false;
  }
}

export const upgradeState = new UpgradeState();
