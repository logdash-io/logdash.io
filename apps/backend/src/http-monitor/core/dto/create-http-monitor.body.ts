import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { HttpMonitorMode } from '../enums/http-monitor-mode.enum';

export class CreateHttpMonitorBody {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ enum: HttpMonitorMode, default: HttpMonitorMode.Pull })
  @IsOptional()
  @IsEnum(HttpMonitorMode)
  mode: HttpMonitorMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMaxSize(100)
  notificationChannelsIds?: string[];
}
