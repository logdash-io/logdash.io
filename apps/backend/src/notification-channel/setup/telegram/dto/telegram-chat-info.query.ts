import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TelegramChatInfoQuery {
  @ApiProperty()
  @IsString()
  public passphrase: string;
}
