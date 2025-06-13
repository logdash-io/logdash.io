import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TelegramOptionsValidator {
  @ApiPropertyOptional({
    description: 'If not provided, will use default logdash uptime bot token',
  })
  @IsOptional()
  @IsString()
  public botToken?: string;

  @ApiProperty()
  @IsString()
  public chatId: string;
}

export interface TelegramOptions {
  botToken?: string;
  chatId: string;
}
