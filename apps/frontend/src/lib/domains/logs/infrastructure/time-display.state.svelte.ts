import { browser } from '$app/environment';

export type TimeDisplayMode = 'relative' | 'absolute';

const TIME_DISPLAY_MODE_KEY = 'logs-time-display-mode';

class TimeDisplayState {
  private _mode = $state<TimeDisplayMode>('relative');

  constructor() {
    if (browser) {
      this.init();
    }
  }

  private init(): void {
    const stored = localStorage.getItem(TIME_DISPLAY_MODE_KEY);
    if (stored === 'relative' || stored === 'absolute') {
      this._mode = stored;
    }
  }

  get mode(): TimeDisplayMode {
    return this._mode;
  }

  get isRelative(): boolean {
    return this._mode === 'relative';
  }

  get isAbsolute(): boolean {
    return this._mode === 'absolute';
  }

  toggle(): void {
    this._mode = this._mode === 'relative' ? 'absolute' : 'relative';
    this.persist();
  }

  setMode(mode: TimeDisplayMode): void {
    this._mode = mode;
    this.persist();
  }

  private persist(): void {
    if (browser) {
      localStorage.setItem(TIME_DISPLAY_MODE_KEY, this._mode);
    }
  }
}

export const timeDisplayState = new TimeDisplayState();
