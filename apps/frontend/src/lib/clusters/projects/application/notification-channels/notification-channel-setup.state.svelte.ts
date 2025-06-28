type Props = {
  isOpen: boolean;
  monitorId: string | null;
};

export class NotificationChannelSetupState {
  state = $state<Props>({
    isOpen: true,
    monitorId: null,
  });

  get isOpen(): boolean {
    return this.state.isOpen;
  }

  open(monitorId: string): void {
    this.state.isOpen = true;
    this.state.monitorId = monitorId;
  }

  close(): void {
    this.state.isOpen = false;
  }
}

export const notificationChannelSetupState =
  new NotificationChannelSetupState();
