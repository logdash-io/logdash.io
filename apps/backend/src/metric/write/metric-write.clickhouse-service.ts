import { ClickHouseClient } from '@clickhouse/client';
import { Injectable } from '@nestjs/common';
import { CreateClickhouseMetricDto } from './dto/create-clickhouse-metric.dto';
import { MetricClickhouseEntity } from '../core/entities/metric.clickhouse-entity';

@Injectable()
export class MetricWriteClickhouseService {
  constructor(private readonly clickhouseClient: ClickHouseClient) {}

  public async recordMetrics(metrics: CreateClickhouseMetricDto[]): Promise<void> {
    const entities = metrics.map((metric) =>
      MetricClickhouseEntity.fromCreateClickhouseMetricDto(metric),
    );

    await this.clickhouseClient.insert({
      table: 'metrics',
      values: entities,
      format: 'JSONEachRow',
    });
  }
}
