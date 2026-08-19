import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class TelegramTestMessageBody {
  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  public chatId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  public message: string;
}
