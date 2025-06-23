import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TelegramOptionsValidator {
  @ApiPropertyOptional({
    description: 'If not provided, will use default logdash uptime bot token',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
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
