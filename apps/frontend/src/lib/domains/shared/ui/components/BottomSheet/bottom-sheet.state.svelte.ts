class BottomSheetState {
  isOpen = $state(false);

  public open(): void {
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }
}

export const bottomSheetState = new BottomSheetState();
