import { Injectable } from '@nestjs/common';
import { LogdashMetrics } from '../../src/shared/logdash/aggregate-metrics';

@Injectable()
export class MetricsMock implements LogdashMetrics {
  setMetric(): void {}
  mutateMetric(): void {}
}
