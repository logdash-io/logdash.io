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
  ValidateIf,
} from 'class-validator';
import { IsSafeUrl } from '../../../shared/ssrf/is-safe-url.decorator';
import { HttpMonitorMode } from '../enums/http-monitor-mode.enum';

export class CreateHttpMonitorBody {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.mode || o.mode === HttpMonitorMode.Pull)
  @IsString()
  @MaxLength(1024)
  @IsUrl()
  @IsSafeUrl()
  url?: string;

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
