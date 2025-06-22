import { httpClient } from '$lib/shared/http';
import type {
  TelegramChatInfo,
  NotificationChannel,
} from '$lib/clusters/projects/domain/telegram/telegram.types';

export class TelegramService {
  static async getChatInfo(passphrase: string): Promise<TelegramChatInfo> {
    return httpClient.get<TelegramChatInfo>(
      `/notification_channel_setup/telegram/chat_info?passphrase=${encodeURIComponent(passphrase)}`,
    );
  }

  static async createNotificationChannel(
    clusterId: string,
    chatId: string,
  ): Promise<NotificationChannel> {
    return httpClient.post<NotificationChannel>(
      `/clusters/${clusterId}/notification_channels`,
      {
        type: 'telegram',
        options: {
          chatId,
        },
      },
    );
  }
}
