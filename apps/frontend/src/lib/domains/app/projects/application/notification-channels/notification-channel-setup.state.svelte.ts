import type { NotificationChannelType } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';

type Props = {
  isOpen: boolean;
  channel: NotificationChannelType | null;
};

export class NotificationChannelSetupState {
  state = $state<Props>({
    isOpen: false,
    channel: null,
  });

  public get isOpen(): boolean {
    return this.state.isOpen;
  }

  public get channel(): NotificationChannelType | null {
    return this.state.channel;
  }

  public open(): void {
    this.state.isOpen = true;
    this.state.channel = null;
  }

  public selectChannel(channel: NotificationChannelType | null): void {
    this.state.channel = channel;
  }

  public close(): void {
    this.state.isOpen = false;
  }
}

export const notificationChannelSetupState =
  new NotificationChannelSetupState();
