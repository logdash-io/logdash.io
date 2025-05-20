import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateClusterBody {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;
}
