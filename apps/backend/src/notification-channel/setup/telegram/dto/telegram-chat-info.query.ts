import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/**
 * `/<word>_<word>_<16 hex chars>`. The 64 random bits keep a passphrase from
 * being guessed inside its ttl, and the strict shape keeps the webhook from
 * storing ordinary bot commands such as `/start`.
 */
export const TELEGRAM_PASSPHRASE_REGEX = /^\/[a-z]+_[a-z]+_[0-9a-f]{16}$/;

export class TelegramChatInfoQuery {
  @ApiProperty()
  @IsString()
  @Matches(TELEGRAM_PASSPHRASE_REGEX)
  public passphrase: string;
}
