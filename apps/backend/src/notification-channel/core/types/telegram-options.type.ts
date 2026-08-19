import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Telegram bot token format: `<bot id>:<secret>`. Enforced so the value cannot
 * carry slashes or query separators into the api url path.
 */
const TELEGRAM_BOT_TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]+$/;

export class TelegramOptionsValidator {
  @ApiPropertyOptional({
    description: 'If not provided, will use default logdash uptime bot token',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  @Matches(TELEGRAM_BOT_TOKEN_REGEX)
  public botToken?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  public chatId: string;
}

export interface TelegramOptions {
  botToken?: string;
  chatId: string;
}
