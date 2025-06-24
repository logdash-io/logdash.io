export type TelegramSetupStep = 'setup' | 'waiting' | 'success' | 'error';

export interface TelegramSetupState {
  isOpen: boolean;
  currentStep: TelegramSetupStep;
  passphrase: string;
  chatName: string;
  chatId: string;
  errorMessage: string;
}

export interface TelegramSetupEvents {
  onChannelCreated: (channelId: string, chatName: string) => void;
  onStateChanged?: (state: TelegramSetupState) => void;
}

export interface TelegramChatInfo {
  success: boolean;
  chatId?: string;
  name?: string;
}

export interface TelegramNotificationChannel {
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
