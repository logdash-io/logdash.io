import { IsString } from 'class-validator';

export class TelegramOptionsValidator {
  @IsString()
  public botToken: string;

  @IsString()
  public chatId: string;
}

export interface TelegramOptions {
  botToken: string;
  chatId: string;
}
