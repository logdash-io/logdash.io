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
    const [operation, absoluteValue, deltaValue] = await Promise.all([
      this.redisService.get(this.getMetricBufferLastOperationKey(projectId, metric)),
      this.redisService.get(this.getMetricBufferValueKey(projectId, metric, MetricOperation.Set)),
      this.redisService.get(
        this.getMetricBufferValueKey(projectId, metric, MetricOperation.Change),
      ),
    ]);

    return { operation, absoluteValue, deltaValue };
  }

  public async cleanupProjectData(projectId: string): Promise<void> {
    const metricsKey = this.getMetricBufferChangedMetricsKey(projectId);

    await Promise.all([
      this.redisService.delPattern(`metrics-buffer:project:${projectId}:*`),
      this.redisService.sRem(metricsKey, projectId),
    ]);
  }
}
