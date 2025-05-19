import { ApiPropertyOptional } from '@nestjs/swagger';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReadLogMetricsQuery {
  @ApiPropertyOptional({ enum: MetricGranularity, isArray: true })
  @IsOptional()
  @IsEnum(MetricGranularity, { each: true })
  @Transform(({ value }) => value.split(','))
  granularities?: MetricGranularity[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  after?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  before?: string;
}
