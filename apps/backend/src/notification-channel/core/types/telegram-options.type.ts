import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TelegramOptionsValidator {
  @ApiProperty()
  @IsString()
  public botToken: string;

  @ApiProperty()
  @IsString()
  public chatId: string;
}

export interface TelegramOptions {
  botToken: string;
  chatId: string;
}
