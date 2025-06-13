import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/redis/redis.service';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { TelegramChatInfo } from './dto/telegram-chat-info.dto';
import { TelegramUpdateDto } from './dto/telegram-update.dto';

const PASSPHRASE_BIND_TTL_SECONDS = 60;

@Injectable()
export class TelegramSetupService {
  constructor(private readonly redisService: RedisService) {}

  public async getChatInfoForPassphrase(passphrase: string): Promise<TelegramChatInfo | null> {
    const redisKey = await this.getRedisKeyForPassphrase(passphrase);

    const chatInfo = await this.redisService.get(redisKey);

    if (!chatInfo) {
      return null;
    }

    return JSON.parse(chatInfo);
  }

  public async webhookUpdate(update: TelegramUpdateDto, secret: string): Promise<void> {
    const expectedSecret = getEnvConfig().notificationChannels.telegramUptimeBot.secret;

    if (
      !update.message ||
      secret !== expectedSecret ||
      !update.message.text ||
      !update.message.text.startsWith('/')
    ) {
      return;
    }

    const chatInfo: TelegramChatInfo = {
      id: update.message.chat.id.toString(),
      name: await this.getChatNameFromUpdate(update),
    };

    const redisKey = await this.getRedisKeyForPassphrase(update.message.text);

    await this.redisService.set(redisKey, JSON.stringify(chatInfo), PASSPHRASE_BIND_TTL_SECONDS);
  }

  private async getChatNameFromUpdate(update: TelegramUpdateDto): Promise<string> {
    if (update.message?.chat.title) {
      return update.message.chat.title;
    }

    if (update.message?.chat.last_name && update.message?.chat.first_name) {
      return `${update.message.chat.first_name} ${update.message.chat.last_name}`;
    }

    if (update.message?.chat.first_name) {
      return update.message.chat.first_name;
    }

    if (update.message?.chat.username) {
      return update.message.chat.username;
    }

    return '';
  }

  private async getRedisKeyForPassphrase(passphrase: string): Promise<string> {
    return `notification-channel-setup:telegram:${passphrase}`;
  }
}
