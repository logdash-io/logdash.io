import type { TelegramSetupStateProps } from '$lib/domains/app/projects/domain/telegram/telegram.types';
import { TelegramService } from '$lib/domains/app/projects/infrastructure/telegram/telegram.service';
import { PassphraseGenerator } from '$lib/domains/app/projects/application/notification-channels/passphrase-generator';

export class TelegramSetupState {
  state = $state<TelegramSetupStateProps>({
    currentStep: 'setup',
    passphrase: '',
    chatName: '',
    chatId: '',
  });

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  public startSetup(): void {
    this.stopPolling();
    this.state.currentStep = 'setup';
    this.state.passphrase = PassphraseGenerator.generate();
    this.state.chatName = '';
    this.state.chatId = '';
  }

  public close(): void {
    this.stopPolling();
    this.state.currentStep = 'setup';
    this.state.passphrase = '';
    this.state.chatName = '';
    this.state.chatId = '';
  }

  public startWaiting(): void {
    this.state.currentStep = 'waiting';
    this.startPolling();
  }

  public goBackToSetup(): void {
    if (this.state.currentStep === 'success') {
      this.startSetup();
      return;
    }

    this.stopPolling();
    this.state.currentStep = 'setup';
  }

  private startPolling(): void {
    if (this.pollingInterval) return;

    const poll = async (): Promise<void> => {
      try {
        const response = await TelegramService.getChatInfo(
          this.state.passphrase,
        );

        if (response.success && response.chatId && response.name) {
          this.stopPolling();
          this.state.chatId = response.chatId;
          this.state.chatName = response.name;
          this.state.currentStep = 'success';
        }
      } catch (error) {
        console.error('Error polling for chat info:', error);
      }
    };

    this.pollingInterval = setInterval(() => {
      void poll();
    }, 2000);
    void poll();
  }

  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export const telegramSetupState = new TelegramSetupState();
