import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsEnum, IsOptional, IsString, Max } from 'class-validator';
import { LogReadDirection } from '../enums/log-read-direction.enum';
import { Transform } from 'class-transformer';
import { LogLevel } from '../enums/log-level.enum';

export class ReadLogsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastId: string;

  @ApiPropertyOptional({ enum: LogReadDirection })
  @IsEnum(LogReadDirection)
  @IsOptional()
  direction: LogReadDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @Max(100)
  @Transform(({ value }) => Number(value))
  limit?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({
    enum: LogLevel,
    isArray: true,
    description: 'Filter logs by multiple levels. Takes precedence over level if both provided.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LogLevel, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value].filter(Boolean)))
  levels?: LogLevel[];

  @ApiPropertyOptional({
    description:
      'Search string to filter logs. Returns logs containing all words in the search string.',
  })
  @IsOptional()
  @IsString()
  searchString?: string;
}
