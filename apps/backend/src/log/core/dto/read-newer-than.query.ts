import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsDateString, IsEnum, IsOptional, IsString, Max } from 'class-validator';
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsEnum(LogLevel)
  level?: LogLevel;
}
