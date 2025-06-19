class BackgroundState {
  private _visible = $state(false);

  get isVisible(): boolean {
    return this._visible;
  }

  show(): void {
    this._visible = true;
  }

  hide(): void {
    this._visible = false;
  }
}

export const backgroundState = new BackgroundState();
