/**
 * Domain types for Telegram notification system
 * Contains core business entities and value objects
 */

export interface TelegramChatInfo {
  success: boolean;
  chatId?: string;
  name?: string;
}

export interface NotificationChannel {
  id: string;
  clusterId: string;
  target: 'telegram' | 'webhook';
  options: {
    chatId?: string;
    botToken?: string;
    url?: string;
    headers?: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export type TelegramSetupStep = 'setup' | 'waiting' | 'success' | 'error';

export interface TelegramSetupStateProps {
  isOpen: boolean;
  currentStep: TelegramSetupStep;
  passphrase: string;
  chatName: string;
  chatId: string;
  errorMessage: string;
}

export interface TelegramSetupEvents {
  onChannelCreated: (channelId: string, chatName: string) => void;
}
