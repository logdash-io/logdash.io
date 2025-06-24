import type { TelegramChatInfo } from '$lib/clusters/projects/domain/telegram/telegram.types';
import { httpClient } from '$lib/shared/http';

export class TelegramService {
  static async getChatInfo(passphrase: string): Promise<TelegramChatInfo> {
    return httpClient.get<TelegramChatInfo>(
      `/notification_channel_setup/telegram/chat_info?passphrase=${encodeURIComponent(passphrase)}`,
    );
  }
}
