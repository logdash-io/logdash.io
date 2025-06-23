import type { TelegramSetupStateProps } from '$lib/clusters/projects/domain/telegram/telegram.types';
import { TelegramService } from '$lib/clusters/projects/infrastructure/telegram/telegram.service';
import { PassphraseGenerator } from './passphrase-generator';

export class TelegramSetupState {
  state = $state<TelegramSetupStateProps>({
    isOpen: false,
    currentStep: 'setup',
    passphrase: '',
    chatName: '',
    chatId: '',
    errorMessage: '',
    monitorId: null,
  });

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  startSetup(monitorId: string): void {
    this.state.isOpen = true;
    this.state.currentStep = 'setup';
    this.state.passphrase = PassphraseGenerator.generate();
    this.state.errorMessage = '';
    this.state.monitorId = monitorId;
  }

  close(): void {
    this.stopPolling();
    this.state.isOpen = false;
    this.state.currentStep = 'setup';
    this.state.passphrase = '';
    this.state.chatName = '';
    this.state.chatId = '';
    this.state.errorMessage = '';
    this.state.monitorId = null;
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

    const poll = async () => {
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

    this.pollingInterval = setInterval(poll, 2000);
    poll();
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export const telegramSetupState = new TelegramSetupState();
