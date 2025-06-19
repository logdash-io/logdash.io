import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricOperation } from '@logdash/js-sdk';

interface AddToBufferDto {
  projectId: string;
  metricName: string;
  value: number;
  operation: MetricOperation;
}

@Injectable()
export class MetricBufferService {
  constructor(private readonly redisService: RedisService) {}

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
      this.redisService.set(key, value.toString()),
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

    for (const projectId of changedProjects) {
      const metrics = await this.redisService.sMembers(
        `metrics-buffer:changed-metric:project:${projectId}`,
      );

      for (const metric of metrics) {
        const operation = await this.redisService.get(
          `metrics-buffer:project:${projectId}:metric:${metric}:last-operation`,
        );

        let value: number = 0;

        if (operation === MetricOperation.Set) {
          const valueString = await this.redisService.get(
            `metrics-buffer:project:${projectId}:metric:${metric}:absolute-value`,
          );
          value = valueString ? parseInt(valueString) : 0;
        } else if (operation === MetricOperation.Change) {
          const valueString = await this.redisService.get(
            `metrics-buffer:project:${projectId}:metric:${metric}:delta-value`,
          );
          value = valueString ? parseInt(valueString) : 0;
        }
      }

      await this.redisService.del(`metrics-buffer:project:${projectId}:*`);
      await this.redisService.sRem(`metrics-buffer:changed-projects`, projectId);
    }
  }
}
