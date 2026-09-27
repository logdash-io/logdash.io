import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trimToUndefined = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() || undefined;
};

export class CompleteOnboardingBody {
  @ApiPropertyOptional({ maxLength: 64 })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  role?: string;

  @ApiPropertyOptional({ maxLength: 64 })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
