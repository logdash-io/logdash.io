import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Max } from 'class-validator';
import { LogReadDirection } from '../enums/log-read-direction.enum';
import { Transform } from 'class-transformer';

export class ReadLogsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastId: string;

  @ApiPropertyOptional({ enum: LogReadDirection })
  @IsEnum(LogReadDirection)
  @IsOptional()
  direction;

  @ApiPropertyOptional()
  @IsOptional()
  @Max(100)
  @Transform(({ value }) => Number(value))
  limit?: number;
}
