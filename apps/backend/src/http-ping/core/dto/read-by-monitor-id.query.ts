import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max } from 'class-validator';

export class ReadByMonitorIdQuery {
  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @Max(160)
  limit?: number;
}
