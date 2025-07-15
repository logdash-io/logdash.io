import { browser } from '$app/environment';

const PRO_SKY_BACKGROUND_KEY = 'pro-sky-background-enabled';

class ProSkyBackgroundState {
  private _enabled = $state<boolean>(true);
  private _initialized = $state(false);

  constructor() {
    if (browser) {
      this.init();
    }
  }

  private init(): void {
    const stored = localStorage.getItem(PRO_SKY_BACKGROUND_KEY);
    if (stored !== null) {
      this._enabled = JSON.parse(stored);
    }
    this._initialized = true;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  toggle(): void {
    this._enabled = !this._enabled;
    if (browser) {
      localStorage.setItem(
        PRO_SKY_BACKGROUND_KEY,
        JSON.stringify(this._enabled),
      );
    }
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (browser) {
      localStorage.setItem(
        PRO_SKY_BACKGROUND_KEY,
        JSON.stringify(this._enabled),
      );
    }
  }
}

export const proSkyBackgroundState = new ProSkyBackgroundState();
