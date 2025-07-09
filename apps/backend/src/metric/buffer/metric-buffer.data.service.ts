import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricOperation } from '@logdash/js-sdk';

@Injectable()
export class MetricBufferDataService {
  constructor(private readonly redisService: RedisService) {}

  private getMetricBufferValueKey(
    projectId: string,
    metricName: string,
    operation: MetricOperation,
  ): string {
    if (operation === MetricOperation.Set) {
      return `metrics-buffer:project:${projectId}:metric:${metricName}:absolute-value`;
    } else if (operation === MetricOperation.Change) {
      return `metrics-buffer:project:${projectId}:metric:${metricName}:delta-value`;
    }

    throw new Error('Invalid operation');
  }

  private getMetricBufferLastOperationKey(projectId: string, metricName: string): string {
    return `metrics-buffer:project:${projectId}:metric:${metricName}:last-operation`;
  }

  private getMetricBufferChangedProjectsKey(): string {
    return `metrics-buffer:changed-projects`;
  }

  private getMetricBufferChangedMetricsKey(projectId: string): string {
    return `metrics-buffer:changed-metric:project:${projectId}`;
  }

  public async storeSetMetric(projectId: string, metricName: string, value: number): Promise<void> {
    const key = await this.getMetricBufferValueKey(projectId, metricName, MetricOperation.Set);
    await this.redisService.set(key, value.toString());
  }

  public async storeChangeMetric(
    projectId: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    const key = await this.getMetricBufferValueKey(projectId, metricName, MetricOperation.Change);
    await this.redisService.incrementBy(key, value);
  }

  public async updateLastOperation(
    projectId: string,
    metricName: string,
    operation: MetricOperation,
  ): Promise<void> {
    const key = this.getMetricBufferLastOperationKey(projectId, metricName);
    await this.redisService.set(key, operation);
  }

  public async markAsChanged(projectId: string, metricName: string): Promise<void> {
    const projectKey = this.getMetricBufferChangedProjectsKey();
    const metricsKey = this.getMetricBufferChangedMetricsKey(projectId);
    await this.redisService.sAdd(projectKey, projectId);
    await this.redisService.sAdd(metricsKey, metricName);
  }

  public async getChangedProjects(): Promise<string[]> {
    return this.redisService.sMembers(this.getMetricBufferChangedProjectsKey());
  }

  public async getChangedMetrics(projectId: string): Promise<string[]> {
    const metricsKey = this.getMetricBufferChangedMetricsKey(projectId);
    return this.redisService.sMembers(metricsKey);
  }

  public async getMetricData(
    projectId: string,
    metric: string,
  ): Promise<{
    operation: string | null;
    absoluteValue: string | null;
    deltaValue: string | null;
  }> {
    const keys = [
      this.getMetricBufferLastOperationKey(projectId, metric),
      this.getMetricBufferValueKey(projectId, metric, MetricOperation.Set),
      this.getMetricBufferValueKey(projectId, metric, MetricOperation.Change),
    ];

    const result = await this.redisService.mGet(keys);

    return {
      operation: result[keys[0]],
      absoluteValue: result[keys[1]],
      deltaValue: result[keys[2]],
    };
  }

  public async getBulkMetricData(
    projectMetricPairs: { projectId: string; metricName: string }[],
  ): Promise<
    {
      projectId: string;
      metricName: string;
      operation: string | null;
      absoluteValue: string | null;
      deltaValue: string | null;
    }[]
  > {
    if (projectMetricPairs.length === 0) {
      return [];
    }

    const allKeys: string[] = [];
    const keyMapping: {
      [key: string]: { projectId: string; metricName: string; keyType: string };
    } = {};

    // Build all keys for bulk retrieval
    for (const { projectId, metricName } of projectMetricPairs) {
      const operationKey = this.getMetricBufferLastOperationKey(projectId, metricName);
      const absoluteKey = this.getMetricBufferValueKey(projectId, metricName, MetricOperation.Set);
      const deltaKey = this.getMetricBufferValueKey(projectId, metricName, MetricOperation.Change);

      allKeys.push(operationKey, absoluteKey, deltaKey);
      keyMapping[operationKey] = { projectId, metricName, keyType: 'operation' };
      keyMapping[absoluteKey] = { projectId, metricName, keyType: 'absoluteValue' };
      keyMapping[deltaKey] = { projectId, metricName, keyType: 'deltaValue' };
    }

    // Single mGet call for all keys
    const results = await this.redisService.mGet(allKeys);

    // Group results by project-metric pair
    const metricDataMap = new Map<
      string,
      {
        projectId: string;
        metricName: string;
        operation: string | null;
        absoluteValue: string | null;
        deltaValue: string | null;
      }
    >();

    for (const [key, value] of Object.entries(results)) {
      const mapping = keyMapping[key];
      if (mapping) {
        const mapKey = `${mapping.projectId}-${mapping.metricName}`;
        if (!metricDataMap.has(mapKey)) {
          metricDataMap.set(mapKey, {
            projectId: mapping.projectId,
            metricName: mapping.metricName,
            operation: null,
            absoluteValue: null,
            deltaValue: null,
          });
        }
        const data = metricDataMap.get(mapKey)!;
        if (mapping.keyType === 'operation') {
          data.operation = value;
        } else if (mapping.keyType === 'absoluteValue') {
          data.absoluteValue = value;
        } else if (mapping.keyType === 'deltaValue') {
          data.deltaValue = value;
        }
      }
    }

    return Array.from(metricDataMap.values());
  }

  public async cleanupProjectData(projectId: string): Promise<void> {
    const metricsKey = this.getMetricBufferChangedMetricsKey(projectId);

    await Promise.all([
      this.redisService.delPattern(`metrics-buffer:project:${projectId}:*`),
      this.redisService.sRem(metricsKey, projectId),
    ]);
  }
}
