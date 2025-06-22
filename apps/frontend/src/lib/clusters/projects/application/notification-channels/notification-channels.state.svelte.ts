import type { NotificationChannelsState } from '$lib/clusters/projects/domain/notification-channels/notification-channels.types';
import type { NotificationChannel } from '$lib/clusters/projects/domain/telegram/telegram.types';
import { NotificationChannelsService } from '$lib/clusters/projects/infrastructure/notification-channels/notification-channels.service';

export class NotificationChannelsStateManager {
  state = $state<NotificationChannelsState>({
    channels: [],
    isLoading: false,
    error: null,
  });

  async loadChannels(clusterId: string): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const channels =
        await NotificationChannelsService.getNotificationChannels(clusterId);
      // Sort by newest first (createdAt descending)
      this.state.channels = channels.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error('Error loading notification channels:', error);
      this.state.error =
        error instanceof Error
          ? error.message
          : 'Failed to load notification channels';
    } finally {
      this.state.isLoading = false;
    }
  }

  async deleteChannel(clusterId: string, channelId: string): Promise<void> {
    try {
      await NotificationChannelsService.deleteNotificationChannel(
        clusterId,
        channelId,
      );

      this.state.channels = this.state.channels.filter(
        (channel) => channel.id !== channelId,
      );
    } catch (error) {
      console.error('Error deleting notification channel:', error);
      this.state.error =
        error instanceof Error
          ? error.message
          : 'Failed to delete notification channel';
    }
  }

  addChannel(channel: NotificationChannel): void {
    this.state.channels = [channel, ...this.state.channels];
  }

  clearError(): void {
    this.state.error = null;
  }
}

export const notificationChannelsState = new NotificationChannelsStateManager();
