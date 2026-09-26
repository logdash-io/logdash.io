import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class ReadMetricHistoryQuery {
  @ApiPropertyOptional({ enum: MetricGranularity })
  @IsOptional()
  @IsEnum(MetricGranularity)
  granularity?: MetricGranularity;

  @ApiPropertyOptional({ description: 'Only the newest entries, up to this many.' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
