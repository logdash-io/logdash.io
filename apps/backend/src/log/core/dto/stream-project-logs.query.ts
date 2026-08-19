import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StreamProjectLogsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  lastId?: string;
}
