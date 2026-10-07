import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsMongoId,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const CLICK_IDS = [
  'gclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'dclid',
  'msclkid',
  'fbclid',
  'ttclid',
  'twclid',
  'li_fat_id',
];

export class WebEventBody {
  @ApiProperty()
  @IsUUID('4')
  id: string;

  @ApiPropertyOptional({ deprecated: true, description: 'Sent by old trackers, ignored' })
  @IsOptional()
  @IsUUID('4')
  visitorId?: string;

  @ApiPropertyOptional({ deprecated: true, description: 'Sent by old trackers, ignored' })
  @IsOptional()
  @IsUUID('4')
  sessionId?: string;

  @ApiPropertyOptional({ deprecated: true, description: 'Sent by old trackers, ignored' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @MaxLength(30)
  visitorStartedAt?: string;

  @ApiProperty()
  @IsISO8601({ strict: true })
  @MaxLength(30)
  timestamp: string;

  @ApiProperty({ example: 'pageview' })
  @Matches(/^[a-z][a-z0-9_]{0,63}$/)
  name: string;

  @ApiProperty({ example: '/pricing' })
  @IsString()
  @MaxLength(1024)
  path: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referrer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  utmSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  utmMedium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  utmCampaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  utmTerm?: string;

  @ApiPropertyOptional({ enum: ['', ...CLICK_IDS] })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clickId?: string;

  @ApiPropertyOptional({ example: 'Europe/Warsaw' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'sha256(siteId:userId) as lowercase hex, hashed in the browser',
  })
  @IsOptional()
  @Matches(/^[a-f0-9]{64}$/)
  userId?: string;
}

export class CollectWebEventsBody {
  @ApiProperty()
  @IsMongoId()
  siteId: string;

  @ApiProperty({ description: 'Browser clock when the request was sent' })
  @IsISO8601({ strict: true })
  @MaxLength(30)
  sentAt: string;

  @ApiProperty({ type: WebEventBody, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => WebEventBody)
  events: WebEventBody[];
}
