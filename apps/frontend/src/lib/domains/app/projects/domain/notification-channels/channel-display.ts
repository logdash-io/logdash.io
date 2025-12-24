import type { NotificationChannel } from '$lib/domains/app/projects/domain/telegram/telegram.types.js';

export function getChannelDisplayName(channel: NotificationChannel): string {
  return channel.name || `${channel.target} Channel`;
}

export function getChannelTypeLabel(channel: NotificationChannel): string {
  if (channel.target === 'telegram') {
    return 'Telegram';
  }

  if (channel.target === 'webhook') {
    return 'Webhook';
  }

  return 'Channel';
}
