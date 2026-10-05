export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel: string;
};

class ConfirmState {
  private _request = $state<ConfirmRequest | null>(null);
  private _isOpen = $state(false);
  private resolve: ((confirmed: boolean) => void) | null = null;

  public get request(): ConfirmRequest | null {
    return this._request;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public ask(request: ConfirmRequest): Promise<boolean> {
    this.resolve?.(false);
    this._request = request;
    this._isOpen = true;

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  public settle(confirmed: boolean): void {
    this.resolve?.(confirmed);
    this.resolve = null;
    this._isOpen = false;
  }
}

export const confirmDialog = new ConfirmState();
