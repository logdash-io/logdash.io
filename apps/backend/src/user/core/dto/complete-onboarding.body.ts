import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CompleteOnboardingBody {
  @ApiProperty({ maxLength: 64 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  role: string;

  @ApiProperty({ maxLength: 64 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  source: string;
}
