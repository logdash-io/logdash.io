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
      await this.storeSetMetric(dto.projectId, dto.metricName, dto.value);
    } else if (dto.operation === MetricOperation.Change) {
      await this.storeChangeMetric(dto.projectId, dto.metricName, dto.value);
    }

    await this.addToSetOfChanged(dto.projectId, dto.metricName);
  }

  public async storeSetMetric(projectId: string, metricName: string, value: number): Promise<void> {
    const key = `metrics-buffer:project:${projectId}:metric:${metricName}:absolute-value`;
    await Promise.all([
      this.redisService.set(key, value.toString()),
      this.updateLastOperation(projectId, metricName, MetricOperation.Set),
    ]);
  }

  public async storeChangeMetric(
    projectId: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    const key = `metrics-buffer:project:${projectId}:metric:${metricName}:delta-value`;
    await Promise.all([
      this.redisService.incrementBy(key, value),
      this.updateLastOperation(projectId, metricName, MetricOperation.Change),
    ]);
  }

  public async updateLastOperation(
    projectId: string,
    metricName: string,
    operation: MetricOperation,
  ): Promise<void> {
    const key = `metrics-buffer:project:${projectId}:metric:${metricName}:last-operation`;
    await this.redisService.set(key, operation);
  }

  public async addToSetOfChanged(projectId: string, metricName: string): Promise<void> {
    const projectKey = `metrics-buffer:changed-projects`;
    const metricsKey = `metrics-buffer:changed-metric:project:${projectId}`;
    await this.redisService.sAdd(projectKey, projectId);
    await this.redisService.sAdd(metricsKey, metricName);
  }

  public async flushBuffer(): Promise<void> {
    const changedProjects = await this.redisService.sMembers(`metrics-buffer:changed-projects`);

    const updates: {
      projectId: string;
      metricName: string;
      value: number;
      operation: MetricOperation;
    }[] = [];

    await Promise.all(
      changedProjects.map(async (projectId) => {
        const metricsKey = `metrics-buffer:changed-metric:project:${projectId}`;
        const metrics = await this.redisService.sMembers(metricsKey);

        await Promise.all(
          metrics.map(async (metric) => {
            const [operation, absoluteValue, deltaValue] = await Promise.all([
              this.redisService.get(
                `metrics-buffer:project:${projectId}:metric:${metric}:last-operation`,
              ),
              this.redisService.get(
                `metrics-buffer:project:${projectId}:metric:${metric}:absolute-value`,
              ),
              this.redisService.get(
                `metrics-buffer:project:${projectId}:metric:${metric}:delta-value`,
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
