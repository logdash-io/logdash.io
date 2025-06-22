import type {
  TelegramSetupEvents,
  TelegramSetupStateProps,
} from '$lib/clusters/projects/domain/telegram/telegram.types';
import { TelegramService } from '$lib/clusters/projects/infrastructure/telegram/telegram.service';
import { PassphraseGenerator } from './passphrase-generator';

export class TelegramSetupState {
  state = $state<TelegramSetupStateProps>({
    isOpen: true,
    currentStep: 'setup',
    passphrase: '',
    chatName: '',
    chatId: '',
    errorMessage: '',
  });

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private events: TelegramSetupEvents;

  bind(events: TelegramSetupEvents): void {
    this.events = events;
  }

  startSetup(): void {
    this.state.isOpen = true;
    this.state.currentStep = 'setup';
    this.state.passphrase = PassphraseGenerator.generate();
    this.state.errorMessage = '';
  }

  close(): void {
    this.stopPolling();
    this.state.isOpen = false;
    this.state.currentStep = 'setup';
    this.state.passphrase = '';
    this.state.chatName = '';
    this.state.chatId = '';
    this.state.errorMessage = '';
  }

  startWaiting(): void {
    this.state.currentStep = 'waiting';
    this.startPolling();
  }

  goBackToSetup(): void {
    this.stopPolling();
    this.state.currentStep = 'setup';
  }

  retry(): void {
    this.state.passphrase = PassphraseGenerator.generate();
    this.state.currentStep = 'setup';
    this.state.errorMessage = '';
  }

  private startPolling(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await TelegramService.getChatInfo(
          this.state.passphrase,
        );

        if (response.success && response.chatId && response.name) {
          this.stopPolling();
          this.state.chatId = response.chatId;
          this.state.chatName = response.name;
          await this.createNotificationChannel();
        }
      } catch (error) {
        console.error('Error polling for chat info:', error);
        // Continue polling - user might not have sent message yet
      }
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async createNotificationChannel(): Promise<void> {
    try {
      const channel = await TelegramService.createNotificationChannel(
        '', // Will be injected by the UI component
        this.state.chatId,
      );

      this.state.currentStep = 'success';
      this.events.onChannelCreated(channel.id, this.state.chatName);
    } catch (error) {
      console.error('Error creating notification channel:', error);
      this.state.currentStep = 'error';
      this.state.errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create notification channel';
    }
  }

  async createNotificationChannelForCluster(clusterId: string): Promise<void> {
    try {
      const channel = await TelegramService.createNotificationChannel(
        clusterId,
        this.state.chatId,
      );

      this.state.currentStep = 'success';
      this.events.onChannelCreated(channel.id, this.state.chatName);
    } catch (error) {
      console.error('Error creating notification channel:', error);
      this.state.currentStep = 'error';
      this.state.errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create notification channel';
    }
  }

  destroy(): void {
    this.stopPolling();
  }
}

export const telegramSetupState = new TelegramSetupState();
