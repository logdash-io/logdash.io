import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramChatInfoResponse {
  @ApiProperty()
  public success: boolean;

  @ApiPropertyOptional()
  public chatId?: string;

  @ApiPropertyOptional()
  public name?: string;
}
