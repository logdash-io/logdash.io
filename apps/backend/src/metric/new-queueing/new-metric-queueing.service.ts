import { Injectable } from '@nestjs/common';
import { MetricOperation } from '@logdash/js-sdk';
import {
  AddToSetResult,
  MetricRegisterRedisService,
} from '../../metric-register/redis/metric-register-redis.service';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricBufferService } from '../buffer/metric-buffer.service';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';

@Injectable()
export class NewMetricQueueingService {
  constructor(
    private readonly metricRegisterRedisService: MetricRegisterRedisService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly metricBufferService: MetricBufferService,
  ) {}

  public async queueMetric(dto: RecordMetricDto): Promise<void> {
    await this.ensureProjectIsUnlocked(dto.projectId);

    const tier = (await this.projectReadCachedService.readProjectOrThrow(dto.projectId)).tier;

    const limit = getProjectPlanConfig(tier).metrics.maxMetricsRegisterEntries;

    const result = await this.metricRegisterRedisService.tryAddToCreatedSet(
      dto.projectId,
      dto.name,
      limit,
    );

    if (result === AddToSetResult.Added) {
      await this.metricRegisterWriteService.createMany([
        {
          name: dto.name,
          projectId: dto.projectId,
        },
      ]);

      await this.metricBufferService.addToBuffer(dto);
    } else if (result === AddToSetResult.AlreadyInSet) {
      await this.metricBufferService.addToBuffer(dto);
    } else if (result === AddToSetResult.SetEmptyProjectLocked) {
      await this.metricRegisterRedisService.syncProjectFromMongo(dto.projectId);
      await this.metricRegisterRedisService.unlockProject(dto.projectId);
      try {
        await this.metricRegisterWriteService.createMany([
          {
            name: dto.name,
            projectId: dto.projectId,
          },
        ]);
      } catch {}
      await this.metricRegisterRedisService.tryAddToCreatedSet(
        dto.projectId,
        dto.name,
        limit,
        true,
      );
      await this.metricBufferService.addToBuffer(dto);
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
