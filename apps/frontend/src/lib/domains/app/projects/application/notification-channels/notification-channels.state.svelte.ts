import type { NotificationChannelsState } from '$lib/domains/app/projects/domain/notification-channels/notification-channels.types';
import type { CreateNotificationChannelDTO } from '$lib/domains/app/projects/domain/telegram/telegram.types';
import { NotificationChannelsService } from '$lib/domains/app/projects/infrastructure/notification-channels/notification-channels.service';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { AxiosError } from 'axios';

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

  async deleteChannel(channelId: string): Promise<void> {
    try {
      await NotificationChannelsService.deleteNotificationChannel(channelId);

      this.state.channels = this.state.channels.filter(
        (channel) => channel.id !== channelId,
      );

      toast.success('Notification channel deleted');
    } catch (error) {
      console.error('Error deleting notification channel:', error);
      this.state.error =
        error instanceof Error
          ? error.message
          : 'Failed to delete notification channel';
    }
  }

  async createChannel(
    clusterId: string,
    channel: CreateNotificationChannelDTO,
  ): Promise<string> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const createdChannel =
        await NotificationChannelsService.createNotificationChannel(
          clusterId,
          channel,
        );

      toast.success('Notification channel created');
      return createdChannel.id;

      // todo: push to state.channels once backend contract returns NotificationChannel from creation
      // this.state.channels.push(createdChannel);
    } catch (error) {
      // todo: make error handling generic
      toast.error(
        `${
          error instanceof AxiosError
            ? error.response?.data?.message
            : 'Failed to create notification channel'
        }`,
      );
    } finally {
      this.state.isLoading = false;
    }
  }

  clearError(): void {
    this.state.error = null;
  }
}

export const notificationChannelsState = new NotificationChannelsStateManager();
