import { ApiProperty } from '@nestjs/swagger';
import { MetricGranularity } from '../../../metric-shared/enums/metric-granularity.enum';

export class MetricNormalized {
  id: string;
  timeBucket: string;
  metricRegisterEntryId: string;
  value: number;
  projectId: string;
  granularity: MetricGranularity;
}

export class MetricSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  metricRegisterEntryId: string;

  @ApiProperty({ enum: MetricGranularity })
  granularity: MetricGranularity;
}

export class SimpleMetric {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  metricRegisterEntryId: string;
}

export class ClusterMetric extends SimpleMetric {
  @ApiProperty({ description: 'The app that reports the metric.' })
  app: string;

  @ApiProperty()
  projectId: string;
}
