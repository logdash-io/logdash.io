import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';

class HeroTakeoverState {
  private _minimized = $state(false);
  private _origin: DOMRect | null = null;

  public get available(): boolean {
    return (
      anonymousPreviewState.phase === 'creating' ||
      anonymousPreviewState.preview !== null
    );
  }

  public get expanded(): boolean {
    return this.available && !this._minimized;
  }

  public get origin(): DOMRect | null {
    return this._origin;
  }

  public expand(origin: DOMRect | null): void {
    this._origin = origin;
    this._minimized = false;
  }

  public minimize(): void {
    this._minimized = true;
  }
}

export const heroTakeover = new HeroTakeoverState();
