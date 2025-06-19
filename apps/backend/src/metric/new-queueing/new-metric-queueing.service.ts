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

      await this.metricBufferService.addToBuffer({
        projectId: dto.projectId,
        metricName: dto.metricName,
        value: dto.value,
        operation: dto.operation,
      });
    } else if (result === AddToSetResult.AlreadyInSet) {
      await this.metricBufferService.addToBuffer({
        projectId: dto.projectId,
        metricName: dto.metricName,
        value: dto.value,
        operation: dto.operation,
      });
    } else if (result === AddToSetResult.OverLimit) {
      throw new Error('You cannot add more metrics');
    }
  }
}
