import type { TelegramChatInfo } from '$lib/domains/app/projects/domain/telegram/telegram.types';
import { httpClient } from '$lib/domains/shared/http';

export class TelegramService {
  static async getChatInfo(passphrase: string): Promise<TelegramChatInfo> {
    return httpClient.get<TelegramChatInfo>(
      `/notification_channel_setup/telegram/chat_info?passphrase=${encodeURIComponent(passphrase)}`,
    );
  }
}
