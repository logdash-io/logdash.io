import { Injectable, Module } from '@nestjs/common';
import { MetricOperation } from '@logdash/js-sdk';
import {
  AddToSetResult,
  MetricRegisterRedisService,
} from '../../metric-register/redis/metric-register-redis.service';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricBufferService } from '../buffer/metric-buffer.service';
import { RateLimit } from '../../shared/responses/rate-limit.response';

interface QueueMetricDto {
  projectId: string;
  metricName: string;
  operation: MetricOperation;
  value: number;
}

@Injectable()
export class NewMetricQueueingService {
  constructor(
    private readonly metricRegisterRedisService: MetricRegisterRedisService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly metricBufferService: MetricBufferService,
  ) {}

  public async queueMetric(dto: QueueMetricDto): Promise<void> {
    await this.ensureProjectIsUnlocked(dto.projectId);

    const result = await this.metricRegisterRedisService.tryAddToCreatedSet(
      dto.projectId,
      dto.metricName,
      5,
    );

    if (result === AddToSetResult.Added) {
      await this.metricRegisterWriteService.createMany([
        {
          name: dto.metricName,
          projectId: dto.projectId,
        },
      ]);

      await this.metricBufferService.addToBuffer(dto);
    } else if (result === AddToSetResult.AlreadyInSet) {
      await this.metricBufferService.addToBuffer(dto);
    } else if (result === AddToSetResult.SetEmptyProjectLocked) {
      await this.metricRegisterRedisService.syncProjectFromMongo(dto.projectId);
      await this.metricRegisterRedisService.unlockProject(dto.projectId);
    } else if (result === AddToSetResult.OverLimit) {
      throw new Error('You cannot add more metrics');
    }
  }

  private async ensureProjectIsUnlocked(projectId: string): Promise<void> {
    while (await this.metricRegisterRedisService.projectIsLocked(projectId)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
