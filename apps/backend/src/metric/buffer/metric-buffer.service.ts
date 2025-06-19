import { Injectable } from '@nestjs/common';
import { MetricOperation } from '@logdash/js-sdk';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { MetricBufferDataService } from './metric-buffer.data.service';
import { RedisService } from '../../shared/redis/redis.service';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';

interface AddToBufferDto {
  projectId: string;
  metricName: string;
  value: number;
  operation: MetricOperation;
}

@Injectable()
export class MetricBufferService {
  constructor(
    private readonly metricBufferDataService: MetricBufferDataService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
  ) {}

  public async addToBuffer(dto: RecordMetricDto): Promise<void> {
    if (dto.operation === MetricOperation.Set) {
      await Promise.all([
        this.metricBufferDataService.storeSetMetric(dto.projectId, dto.name, dto.value),
        this.metricBufferDataService.updateLastOperation(
          dto.projectId,
          dto.name,
          MetricOperation.Set,
        ),
        this.metricBufferDataService.markAsChanged(dto.projectId, dto.name),
      ]);
    } else if (dto.operation === MetricOperation.Change) {
      await Promise.all([
        this.metricBufferDataService.storeChangeMetric(dto.projectId, dto.name, dto.value),
        this.metricBufferDataService.updateLastOperation(
          dto.projectId,
          dto.name,
          MetricOperation.Change,
        ),
        this.metricBufferDataService.markAsChanged(dto.projectId, dto.name),
      ]);
    }
  }

  public async flushBuffer(): Promise<void> {
    const changedProjects = await this.metricBufferDataService.getChangedProjects();

    const updates: {
      projectId: string;
      metricName: string;
      value: number;
      operation: MetricOperation;
    }[] = [];

    await Promise.all(
      changedProjects.map(async (projectId) => {
        const metrics = await this.metricBufferDataService.getChangedMetrics(projectId);

        await Promise.all(
          metrics.map(async (metric) => {
            const { operation, absoluteValue, deltaValue } =
              await this.metricBufferDataService.getMetricData(projectId, metric);

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

        await this.metricBufferDataService.cleanupProjectData(projectId);
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

    // console.log(`Time it took to read metrics: ${afterReading - now}ms`);
    // console.log(`Time it took to write metrics: ${afterWriting - afterReading}ms`);
  }
}
