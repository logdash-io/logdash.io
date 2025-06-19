import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricOperation } from '@logdash/js-sdk';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';

interface AddToBufferDto {
  projectId: string;
  metricName: string;
  value: number;
  operation: MetricOperation;
}

@Injectable()
export class MetricBufferService {
  constructor(
    private readonly redisService: RedisService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
  ) {}

  public async addToBuffer(dto: AddToBufferDto): Promise<void> {
    if (dto.operation === MetricOperation.Set) {
      await Promise.all([
        this.storeSetMetric(dto.projectId, dto.metricName, dto.value),
        this.updateLastOperation(dto.projectId, dto.metricName, MetricOperation.Set),
        this.addToSetOfChanged(dto.projectId, dto.metricName),
      ]);
    } else if (dto.operation === MetricOperation.Change) {
      await Promise.all([
        this.storeChangeMetric(dto.projectId, dto.metricName, dto.value),
        this.updateLastOperation(dto.projectId, dto.metricName, MetricOperation.Change),
        this.addToSetOfChanged(dto.projectId, dto.metricName),
      ]);
    }
  }

  private async getMetricBufferValueKey(
    projectId: string,
    metricName: string,
    operation: MetricOperation,
  ): Promise<string> {
    if (operation === MetricOperation.Set) {
      return `metrics-buffer:project:${projectId}:metric:${metricName}:absolute-value`;
    } else if (operation === MetricOperation.Change) {
      return `metrics-buffer:project:${projectId}:metric:${metricName}:delta-value`;
    }

    throw new Error('Invalid operation');
  }

  private async getMetricBufferLastOperationKey(
    projectId: string,
    metricName: string,
  ): Promise<string> {
    return `metrics-buffer:project:${projectId}:metric:${metricName}:last-operation`;
  }

  private async getMetricBufferChangedProjectsKey(): Promise<string> {
    return `metrics-buffer:changed-projects`;
  }

  private async getMetricBufferChangedMetricsKey(projectId: string): Promise<string> {
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
    const key = await this.getMetricBufferLastOperationKey(projectId, metricName);
    await this.redisService.set(key, operation);
  }

  public async addToSetOfChanged(projectId: string, metricName: string): Promise<void> {
    const projectKey = await this.getMetricBufferChangedProjectsKey();
    const metricsKey = await this.getMetricBufferChangedMetricsKey(projectId);
    await this.redisService.sAdd(projectKey, projectId);
    await this.redisService.sAdd(metricsKey, metricName);
  }

  public async flushBuffer(): Promise<void> {
    const changedProjects = await this.redisService.sMembers(
      await this.getMetricBufferChangedProjectsKey(),
    );

    const updates: {
      projectId: string;
      metricName: string;
      value: number;
      operation: MetricOperation;
    }[] = [];

    await Promise.all(
      changedProjects.map(async (projectId) => {
        const metricsKey = await this.getMetricBufferChangedMetricsKey(projectId);
        const metrics = await this.redisService.sMembers(metricsKey);

        await Promise.all(
          metrics.map(async (metric) => {
            const [operation, absoluteValue, deltaValue] = await Promise.all([
              this.redisService.get(await this.getMetricBufferLastOperationKey(projectId, metric)),
              this.redisService.get(
                await this.getMetricBufferValueKey(projectId, metric, MetricOperation.Set),
              ),
              this.redisService.get(
                await this.getMetricBufferValueKey(projectId, metric, MetricOperation.Change),
              ),
            ]);

            let value = 0;
            if (operation === MetricOperation.Set && absoluteValue) {
              value = parseInt(absoluteValue);
            } else if (operation === MetricOperation.Change && deltaValue) {
              value = parseInt(deltaValue);
            }

            updates.push({
              projectId,
              metricName: metric,
              value,
              operation: operation as MetricOperation,
            });
          }),
        );

        await Promise.all([
          this.redisService.del(`metrics-buffer:project:${projectId}:*`),
          this.redisService.sRem(`metrics-buffer:changed-projects`, projectId),
        ]);
      }),
    );

    const now = performance.now();

    const updatesWithMetricId =
      await this.metricRegisterReadService.readIdsFromProjectIdMetricNamePairs(
        updates.map((update) => ({
          projectId: update.projectId,
          metricName: update.metricName,
        })),
      );

    const afterReading = performance.now();

    const updatesParsed = updates.map((update) => ({
      ...update,
      metricId: updatesWithMetricId[`${update.projectId}-${update.metricName}`],
    }));

    await this.metricRegisterWriteService.upsertAbsoluteValues(
      updatesParsed.map((update) => ({
        metricRegisterEntryId: update.metricId,
        value: update.value,
        operation: update.operation,
      })),
    );

    const afterWriting = performance.now();

    console.log(`Time it took to read metrics: ${afterReading - now}ms`);
    console.log(`Time it took to write metrics: ${afterWriting - afterReading}ms`);
  }
}
