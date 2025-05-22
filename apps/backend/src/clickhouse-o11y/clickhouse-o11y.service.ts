import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { Logger, Metrics } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { getEnvConfig } from 'src/shared/configs/env-configs';

enum PerformanceMetric {
  RamUsage = 'ramUsage',
  CpuLoadPercentage = 'cpuLoadPercentage',
  StorageUsage = 'storageUsage',
}

@Injectable()
export class ClickhouseO11yService {
  private readonly clickhouse: ClickHouseClient;

  constructor(
    private readonly logger: Logger,
    private readonly metrics: Metrics,
  ) {
    const clickHouseConfig = getEnvConfig().clickhouse;
    this.clickhouse = createClient({ ...clickHouseConfig });
  }

  public async collectAndReportMetrics(): Promise<void> {
    try {
      await this.collectMetrics();
    } catch (error) {
      const payload = { message: error.message };
      this.logger.error('Failed to collect and report ClickHouse metrics', payload);
    }
  }

  private async collectMetrics(): Promise<void> {
    const result = await this.clickhouse.query({
      query: `
        SELECT 
          metric,
          toUInt64(value) as value
        FROM system.metrics
        WHERE metric IN ('MemoryTracking', 'QueryThread', 'ThreadPoolActiveThreads', 'ThreadPoolMaxThreads')
        
        UNION ALL
        
        SELECT 
          'StorageUsage' as metric,
          toUInt64(sum(bytes_on_disk)) as value
        FROM system.parts
        WHERE active = 1
      `,
      format: 'JSONEachRow',
    });

    const data = await result.json<{ metric: string; value: number }[]>();
    const metricsMap = new Map(data.map((item) => [item.metric, item.value]));

    const memoryUsage = metricsMap.get('MemoryTracking') || 0;
    const activeThreads = metricsMap.get('ThreadPoolActiveThreads') || 0;
    const maxThreads = metricsMap.get('ThreadPoolMaxThreads') || 1;
    const storageUsage = metricsMap.get('StorageUsage') || 0;
    const cpuLoadPercentage = Math.round((activeThreads / maxThreads) * 100);

    this.reportMetrics(memoryUsage, cpuLoadPercentage, storageUsage);
    this.logger.log('ClickHouse metrics collected and reported');
  }

  private toMb(bytes: number): number {
    return Math.round(bytes / (1024 * 1024));
  }

  private reportMetrics(
    memoryUsage: number,
    cpuLoadPercentage: number,
    storageUsage: number,
  ): void {
    this.metrics.set(PerformanceMetric.RamUsage, this.toMb(memoryUsage));
    this.metrics.set(PerformanceMetric.CpuLoadPercentage, cpuLoadPercentage);
    this.metrics.set(PerformanceMetric.StorageUsage, this.toMb(storageUsage));
  }
}
