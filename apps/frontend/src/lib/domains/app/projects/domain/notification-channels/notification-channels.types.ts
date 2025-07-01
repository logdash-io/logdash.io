/**
 * Domain types for notification channels management
 */

import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types';

export interface NotificationChannelsState {
  channels: NotificationChannel[];
  isLoading: boolean;
  error: string | null;
}
