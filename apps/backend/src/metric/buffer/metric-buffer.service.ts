import { Injectable } from '@nestjs/common';
import { Logger, MetricOperation } from '@logdash/js-sdk';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { MetricBufferDataService } from './metric-buffer.data.service';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MetricBufferService {
  constructor(
    private readonly metricBufferDataService: MetricBufferDataService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly logger: Logger,
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

  @Cron(CronExpression.EVERY_5_SECONDS)
  public async flushBuffer(): Promise<void> {
    const now = performance.now();

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
            } else if (operation === MetricOperation.Change && deltaValue && absoluteValue) {
              value = parseInt(deltaValue) + parseInt(absoluteValue);
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

    const projectIdMetricNameToMetricRegisterEntryIdAndValue =
      await this.metricRegisterReadService.readIdsAndValuesFromProjectIdMetricNamePairs(
        updates.map((update) => ({
          projectId: update.projectId,
          metricName: update.metricName,
        })),
      );

    console.log(projectIdMetricNameToMetricRegisterEntryIdAndValue);
    console.log(updates);

    const updatesWithMetricId = updates
      .map((update) => {
        const entry =
          projectIdMetricNameToMetricRegisterEntryIdAndValue[
            `${update.projectId}-${update.metricName}`
          ];
        if (!entry) {
          return null;
        }
        return {
          ...update,
          metricId: entry.id,
          baselineValue: entry.value,
        };
      })
      .filter((update): update is NonNullable<typeof update> => update !== null);

    await this.metricRegisterWriteService.upsertAbsoluteValues(
      updatesWithMetricId.map((update) => ({
        metricRegisterEntryId: update.metricId,
        value: update.value + update.baselineValue,
        operation: update.operation,
      })),
    );

    const bufferFlushDurationMs = performance.now() - now;
    this.logger.info(`Buffer flush duration: ${bufferFlushDurationMs}ms`);
  }
}
