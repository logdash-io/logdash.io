import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { Logger, Metrics } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { AverageRecorder } from 'src/shared/logdash/average-metric-recorder.service';

interface ThreadPoolUsage {
  active: number;
  total: number;
}

@Injectable()
export class ClickhouseO11yService {
  private readonly clickhouse: ClickHouseClient;

  constructor(
    private readonly logger: Logger,
    private readonly metrics: Metrics,
    private readonly averageRecorder: AverageRecorder,
  ) {
    this.clickhouse = createClient({
      host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || 'myStrongPassword',
    });
  }

  public async collectAndReportMetrics(): Promise<void> {
    const startTime = performance.now();
    try {
      await this.collectMetrics();
    } catch (error) {
      const payload = { message: error.message };
      this.logger.error('Failed to collect and report ClickHouse metrics', payload);
    } finally {
      this.logCollectionTime(startTime);
    }
  }

  private async collectMetrics(): Promise<void> {
    const memoryUsage = await this.getMemoryUsage();
    const threadPool = await this.getThreadPoolUsage();

    this.reportMetrics(memoryUsage, threadPool);
    this.logger.log('ClickHouse metrics collected and reported');
  }

  private reportMetrics(memoryUsage: number | null, threadPool: ThreadPoolUsage | null): void {
    if (memoryUsage !== null) {
      this.metrics.set('clickhouseRamUsage', memoryUsage);
    }
    if (threadPool !== null) {
      this.metrics.set('clickhouseThreadPoolActive', threadPool.active);
      this.metrics.set('clickhouseThreadPoolTotal', threadPool.total);
    }
  }

  private logCollectionTime(startTime: number): void {
    const collectionTime = performance.now() - startTime;

    this.averageRecorder.record('avgMetricsCollectionTime', collectionTime);
    this.logger.log('ClickHouse metrics collection completed');
  }

  private async getMemoryUsage(): Promise<number | null> {
    try {
      const result = await this.clickhouse.query({
        query: `
          SELECT 
            value
          FROM system.metrics
          WHERE metric = 'MemoryTracking'
        `,
        format: 'JSONEachRow',
      });

      const data = await result.json();
      return data?.[0]?.value || null;
    } catch (error) {
      this.logger.error('Failed to get ClickHouse memory usage', { error: error.message });
      return null;
    }
  }

  private async getThreadPoolUsage(): Promise<ThreadPoolUsage | null> {
    try {
      const active = await this.getActiveThreads();
      if (active === null) return null;

      const total = await this.getTotalThreads();
      if (total === null) return null;

      return { active, total };
    } catch (error) {
      this.logger.error('Failed to get ClickHouse thread pool usage', { error: error.message });
      return null;
    }
  }

  private async getActiveThreads(): Promise<number | null> {
    const result = await this.clickhouse.query({
      query: `
        SELECT 
          value as active
        FROM system.metrics
        WHERE metric = 'ThreadPoolActiveThreads'
      `,
      format: 'JSONEachRow',
    });

    const data = await result.json();
    return data?.[0]?.active || null;
  }

  private async getTotalThreads(): Promise<number | null> {
    const result = await this.clickhouse.query({
      query: `
        SELECT 
          value as total
        FROM system.metrics
        WHERE metric = 'ThreadPoolMaxThreads'
      `,
      format: 'JSONEachRow',
    });

    const data = await result.json();
    return data?.[0]?.total || null;
  }
}
