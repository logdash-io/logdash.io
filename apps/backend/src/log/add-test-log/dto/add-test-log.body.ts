import { ApiProperty } from '@nestjs/swagger';
import { IsIP } from 'class-validator';

export class AddTestLogBody {
  @ApiProperty()
  @IsIP()
  ip: string;
}
