import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DenyCliAuthBody {
  @ApiProperty({ description: 'The glanceable user code shown in the terminal (XXXX-XXXX).' })
  @IsString()
  userCode: string;
}
