import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PollCliAuthBody {
  @ApiProperty({
    description: 'The high-entropy device code held by the initiating CLI (the only retrieval key).',
  })
  @IsString()
  deviceCode: string;
}
