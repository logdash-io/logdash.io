/**
 * Domain types for notification channels management
 */

import type { NotificationChannel } from '../telegram/telegram.types';

export interface NotificationChannelsState {
  channels: NotificationChannel[];
  isLoading: boolean;
  error: string | null;
}
