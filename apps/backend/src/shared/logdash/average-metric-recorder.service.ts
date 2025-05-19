import { Metrics } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

interface MetricToRecord {
  sum: number;
  count: number;
}

@Injectable()
export class AverageRecorder {
  private recordedMetrics: Record<string, MetricToRecord> = {};

  constructor(private readonly metrics: Metrics) {}

  public async record(metric: string, value: number): Promise<void> {
    if (!this.recordedMetrics[metric]) {
      this.recordedMetrics[metric] = { sum: 0, count: 0 };
    }

    this.recordedMetrics[metric].sum += value;
    this.recordedMetrics[metric].count += 1;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async dispatch() {
    const metrics = Object.entries(this.recordedMetrics).map(
      ([metric, { sum, count }]) => {
        return {
          metric,
          value: sum / count,
        };
      },
    );

    metrics.forEach(({ metric, value }) => {
      this.metrics.set(metric, value);
    });

    this.recordedMetrics = {};
  }
}
