export interface TelegramChatInfo {
  success: boolean;
  chatId?: string;
  name?: string;
}

interface TelegramNotificationChannel {
  id: string;
  clusterId: string;
  target: 'telegram';
  name: string;
  options: {
    chatId: string;
    botToken?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WebhookNotificationChannel {
  id: string;
  clusterId: string;
  target: 'webhook';
  name: string;
  options: {
    url: string;
    headers: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel =
  | TelegramNotificationChannel
  | WebhookNotificationChannel;

type CreateTelegramNotificationChannelDTO = {
  type: 'telegram';
  name: string;
  options: {
    chatId: string;
  };
};

export type CreateNotificationChannelDTO = CreateTelegramNotificationChannelDTO;

export type TelegramSetupStep = 'setup' | 'waiting' | 'success' | 'error';

export interface TelegramSetupStateProps {
  isOpen: boolean;
  currentStep: TelegramSetupStep;
  passphrase: string;
  chatName: string;
  chatId: string;
  errorMessage: string;
}
