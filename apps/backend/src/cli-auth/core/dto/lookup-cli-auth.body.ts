import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class LookupCliAuthBody {
  @ApiProperty({
    description: 'The user code the human transcribed from their terminal (XXXX-XXXX).',
  })
  @IsString()
  @MaxLength(32)
  userCode: string;
}
