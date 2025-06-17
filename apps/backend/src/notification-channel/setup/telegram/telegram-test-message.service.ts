import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { RedisService, TtlOverwriteStrategy } from '../../../shared/redis/redis.service';

const RATE_LIMIT_TTL_SECONDS = 3;

@Injectable()
export class TelegramTestMessageService {
  constructor(private readonly redisService: RedisService) {}

  public async sendTestMessage(userId: string, chatId: string, message: string): Promise<void> {
    await this.checkRateLimit(userId);

    const telegramConfig = getEnvConfig().notificationChannels.telegramUptimeBot;
    const url = `https://api.telegram.org/bot${telegramConfig.token}/sendMessage?parse_mode=MarkdownV2`;

    await axios.post(url, {
      chat_id: chatId,
      text: message,
    });
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const key = `notification-channel-setup:telegram:test-message:user:${userId}`;

    const count = await this.redisService.increment(key, {
      ttlOverwriteStrategy: TtlOverwriteStrategy.SetOnlyIfNoExpiry,
      ttlSeconds: RATE_LIMIT_TTL_SECONDS,
    });

    if (count > 1) {
      throw new HttpException(
        'Rate limit exceeded. Please wait 3 seconds between test messages.',
        429,
      );
    }
  }
}
