import type {
  CreateNotificationChannelDTO,
  NotificationChannel,
} from '$lib/clusters/projects/domain/telegram/telegram.types';
import { httpClient } from '$lib/shared/http';

export class NotificationChannelsService {
  static async getNotificationChannels(
    clusterId: string,
  ): Promise<NotificationChannel[]> {
    return httpClient.get<NotificationChannel[]>(
      `/clusters/${clusterId}/notification_channels`,
    );
  }

  static createNotificationChannel(
    clusterId: string,
    channel: CreateNotificationChannelDTO,
  ): Promise<NotificationChannel> {
    return httpClient.post<NotificationChannel>(
      `/clusters/${clusterId}/notification_channels`,
      channel,
    );
  }

  static async deleteNotificationChannel(
    clusterId: string,
    channelId: string,
  ): Promise<void> {
    return httpClient.delete(
      `/clusters/${clusterId}/notification_channels/${channelId}`,
    );
  }
}
