import type { Snippet } from 'svelte';

class TopBarState {
  private _actions = $state<Snippet | null>(null);

  public get actions(): Snippet | null {
    return this._actions;
  }

  public show(actions: Snippet): () => void {
    this._actions = actions;

    return () => {
      if (this._actions === actions) {
        this._actions = null;
      }
    };
  }
}

export const topBarState = new TopBarState();
