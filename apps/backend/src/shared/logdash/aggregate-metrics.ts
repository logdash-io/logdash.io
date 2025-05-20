import { Metrics } from '@logdash/js-sdk';
import { BaseMetrics } from '@logdash/js-sdk/dist/metrics/BaseMetrics';
import { PublicMethods } from '../types/public-methods';

export class AggregateMetrics implements PublicMethods<Metrics> {
  constructor(private readonly metrics: BaseMetrics[]) {}

  mutate(name: string, value: number): void {
    this.metrics.forEach((metric) => metric.mutate(name, value));
  }

  set(name: string, value: number): void {
    this.metrics.forEach((metric) => metric.set(name, value));
  }
}
