import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BadgePeriod } from '../enums/badge-period.enum';
import { BadgeStyle } from '../enums/badge-style.enum';
import { BadgeTheme } from '../enums/badge-theme.enum';

export class ReadBadgeQuery {
  @ApiPropertyOptional({ enum: BadgeStyle, default: BadgeStyle.Classic })
  @IsOptional()
  @IsEnum(BadgeStyle)
  style: BadgeStyle = BadgeStyle.Classic;

  @ApiPropertyOptional({ enum: BadgePeriod, default: BadgePeriod.ThirtyDays })
  @IsOptional()
  @IsEnum(BadgePeriod)
  period: BadgePeriod = BadgePeriod.ThirtyDays;

  @ApiPropertyOptional({ enum: BadgeTheme, default: BadgeTheme.Light })
  @IsOptional()
  @IsEnum(BadgeTheme)
  theme: BadgeTheme = BadgeTheme.Light;
}
