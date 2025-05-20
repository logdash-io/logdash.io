import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateProjectBody {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  public name: string;
}
