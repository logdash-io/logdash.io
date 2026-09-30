class ToastHost {
  private dialogs = $state.raw<HTMLDialogElement[]>([]);

  public get current(): HTMLElement | undefined {
    return this.dialogs.at(-1);
  }

  public enter(dialog: HTMLDialogElement): () => void {
    this.dialogs = [...this.dialogs, dialog];

    return () => {
      this.dialogs = this.dialogs.filter((open) => open !== dialog);
    };
  }
}

export const toastHost = new ToastHost();
