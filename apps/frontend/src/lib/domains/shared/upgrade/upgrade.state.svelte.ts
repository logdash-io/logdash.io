class UpgradeState {
  private _modalVisible = $state(false);
  private _backgroundVisible = $state(false);

  get modalOpen(): boolean {
    return this._modalVisible;
  }

  get backgroundVisible(): boolean {
    return this._backgroundVisible;
  }

  showBackground(): void {
    this._backgroundVisible = true;
  }

  hideBackground(): void {
    this._backgroundVisible = false;
  }

  openModal(): void {
    this._modalVisible = true;
  }

  hideModal(): void {
    this._modalVisible = false;
  }
}

export const upgradeState = new UpgradeState();
