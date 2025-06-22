import { TelegramService } from './telegram.service';

/**
 * Service for polling Telegram chat info
 * Single Responsibility: Polling logic
 */
export class TelegramPollingService {
  private interval: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  startPolling(
    passphrase: string,
    onSuccess: (chatId: string, chatName: string) => void,
    onError: (error: Error) => void,
    intervalMs: number = 2000,
  ): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.interval = setInterval(async () => {
      try {
        const response = await TelegramService.getChatInfo(passphrase);

        if (response.success && response.chatId && response.name) {
          this.stopPolling();
          onSuccess(response.chatId, response.name);
        }
      } catch (error) {
        console.error('Error polling for chat info:', error);
        // Continue polling on error - user might not have sent message yet
      }
    }, intervalMs);
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  get isActive(): boolean {
    return this.isPolling;
  }
}
