import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateProjectBody {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  name: string;
}
