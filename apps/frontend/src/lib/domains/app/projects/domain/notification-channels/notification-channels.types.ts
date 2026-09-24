/**
 * Domain types for notification channels management
 */

import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types';

export type WebhookSetupDTO = {
  withAssignment: boolean;
  url: string;
  headers: Record<string, string>;
  method: string;
  name: string;
};

export interface NotificationChannelsState {
  channels: NotificationChannel[];
  isLoading: boolean;
  error: string | null;
}
