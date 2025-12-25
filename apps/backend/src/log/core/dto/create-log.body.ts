import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '../enums/log-level.enum';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLogBody {
  @ApiProperty()
  @IsDateString()
  @IsString()
  createdAt: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.substring(0, 4096) : value))
  message: string;

  @ApiProperty({ enum: LogLevel })
  @IsEnum(LogLevel)
  level: LogLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  sequenceNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namespace?: string;
}
