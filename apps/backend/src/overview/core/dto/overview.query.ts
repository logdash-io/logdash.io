import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class OverviewQuery {
  @ApiPropertyOptional({
    description:
      'Time window for the verdict, expressed as a duration: <number><unit> where unit is m (minutes), h (hours) or d (days). Defaults to 1h.',
    example: '1h',
    default: '1h',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(m|h|d)$/, {
    message: 'since must be a duration like 30m, 1h, 24h or 7d',
  })
  since?: string;
}
