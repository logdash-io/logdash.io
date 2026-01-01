import { Inject, Injectable } from '@nestjs/common';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { METRICS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { MetricOperation } from '../core/enums/metric-operation.enum';
import { MetricRegisterWriteService } from '../../metric-register/write/metric-register-write.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { MetricBufferDataService } from './metric-buffer.data.service';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';

@Injectable()
export class MetricBufferService {
  constructor(
    private readonly metricBufferDataService: MetricBufferDataService,
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly averageRecorder: AverageRecorder,
    @Inject(METRICS_LOGGER) private readonly logger: LogdashLogger,
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

    // Collect all project-metric pairs first
    const projectMetricPairs: { projectId: string; metrics: string[] }[] = [];
    await Promise.all(
      changedProjects.map(async (projectId) => {
        const metrics = await this.metricBufferDataService.getChangedMetrics(projectId);
        projectMetricPairs.push({ projectId, metrics });
      }),
    );

    // Batch get all metric data in a single mGet call
    const allProjectMetricPairs = projectMetricPairs.flatMap(({ projectId, metrics }) =>
      metrics.map((metricName) => ({ projectId, metricName })),
    );

    const allMetricData =
      await this.metricBufferDataService.getBulkMetricData(allProjectMetricPairs);

    // Process all metric data
    for (const { projectId, metricName, operation, absoluteValue, deltaValue } of allMetricData) {
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
        metricName,
        value,
        operation: operation as MetricOperation,
      });
    }

    // Start cleanup operations asynchronously (don't await yet)
    const cleanupPromise = Promise.all(
      changedProjects.map((projectId) =>
        this.metricBufferDataService.cleanupProjectData(projectId),
      ),
    );

    const projectIdMetricNameToMetricRegisterEntryIdAndValue =
      await this.metricRegisterReadService.readIdsAndValuesFromProjectIdMetricNamePairs(
        updates.map((update) => ({
          projectId: update.projectId,
          metricName: update.metricName,
        })),
      );

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

    // Ensure cleanup is complete before calculating duration
    await cleanupPromise;

    const bufferFlushDurationMs = performance.now() - now;
    // todo: add metrics alerting for the metricsBufferFlushDurationMs
    // this.logger.info(`Buffer flush duration: ${bufferFlushDurationMs}ms`);

    this.averageRecorder.record('metricsBufferFlushDurationMs', bufferFlushDurationMs);
  }
}
