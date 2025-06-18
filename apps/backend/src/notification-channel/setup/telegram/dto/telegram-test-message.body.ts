import { ApiProperty } from '@nestjs/swagger';

export class TelegramTestMessageBody {
  @ApiProperty()
  public chatId: string;

  @ApiProperty()
  public message: string;
}
