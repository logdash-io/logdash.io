import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { HttpMonitorMode } from '../enums/http-monitor-mode.enum';

export class UpdateHttpMonitorBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ enum: HttpMonitorMode })
  @IsOptional()
  @IsEnum(HttpMonitorMode)
  mode?: HttpMonitorMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  notificationChannelsIds?: string[];
}
