import { Injectable } from '@nestjs/common';
import { MetricWriteService } from '../write/metric-write.service';
import { MetricBucketingService } from '../../metric-shared/bucketing/metric-bucketing.service';
import { RecordMetricDto } from './dto/record-metric.dto';
import { MetricReadService } from '../read/metric-read.service';
import { MetricRegisterQualificationService } from '../../metric-register/qualification/metric-register-qualification.service';
import { getUniqueObjects } from '../../shared/utils/unique-objects';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { EnrichedRecordMetricDto } from './dto/enriched-record-metric.dto';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { MetricEventEmitter } from '../events/metric-event.emitter';
import { MetricCreatedEvent } from '../events/definitions/metric-created.event';
import { parseFlexibleDate } from '../../shared/utils/parse-flexible-date';
import { UpsertMetricDto } from '../write/dto/upsert-metric.dto';
import { MetricOperation } from '../core/enums/metric-operation.enum';
import { Logger } from '@logdash/js-sdk';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';
import { getEnvConfig } from '../../shared/configs/env-configs';
export class BucketedMetricDto extends EnrichedRecordMetricDto {
  timeBucket: string;
  granularity: MetricGranularity;
}

@Injectable()
export class MetricIngestionService {
  constructor(
    private readonly metricWriteService: MetricWriteService,
    private readonly metricReadService: MetricReadService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly metricRegisterQualificationService: MetricRegisterQualificationService,
    private readonly metricEventEmitter: MetricEventEmitter,
    private readonly logger: Logger,
    private readonly averageRecorder: AverageRecorder,
  ) {}

  public async recordMetrics(dtos: RecordMetricDto[]): Promise<void> {
    const now = new Date();

    const upsertDtos: UpsertMetricDto[] = [];

    // we get unique metrics by project id and name
    // we need that to get through the registration process
    const uniqueMetrics = getUniqueObjects(
      dtos,
      (dto) => `${dto.projectId}-${dto.name}`,
    );

    // we qualify metrics to check if they are below user limit of registered metrics
    const qualifiedMetrics =
      await this.metricRegisterQualificationService.qualifyMetrics(
        uniqueMetrics.map((dto) => ({
          metricName: dto.name,
          projectId: dto.projectId,
        })),
      );

    // we filter initial dtos to only include qualified metrics
    const qualifiedDtos = dtos.filter((dto) =>
      qualifiedMetrics.some(
        (qualifiedMetric) =>
          qualifiedMetric.metricName === dto.name &&
          qualifiedMetric.projectId === dto.projectId,
      ),
    );

    // map of projectId-metricName pairs to metric register entries ids
    const metricsRegisterEntriesMap =
      await this.metricRegisterReadService.readIdsFromProjectIdMetricNamePairs(
        qualifiedMetrics.map((qualifiedMetric) => ({
          metricName: qualifiedMetric.metricName,
          projectId: qualifiedMetric.projectId,
        })),
      );

    // we need to enrich initial dtos with actual metric register entries ids
    // this is because metrics are identified by metric register entry id. Not
    // by project id and metric name
    const enrichedDtos = qualifiedDtos.map((dto) => ({
      ...dto,
      metricRegisterEntryId:
        metricsRegisterEntriesMap[`${dto.projectId}-${dto.name}`],
    }));

    // we have to read baseline values of these metrics to know what to "add" to
    // if user wants to increase metric "Apples" by 10 I need to know how many apples there currently are
    // it is in format Record<MetricsRegisterEntryId, MetricValue>
    // todo - add batching
    const baselineValues = await this.metricReadService.readBaselineValues({
      metricRegisterEntryIds: Object.values(metricsRegisterEntriesMap),
    });

    for (const dto of enrichedDtos) {
      const bucketedDates = MetricBucketingService.splitDateToBuckets(
        new Date(),
      );

      const baseline = baselineValues[dto.metricRegisterEntryId] || 0;

      const value =
        dto.operation === MetricOperation.Change
          ? dto.value + baseline
          : dto.value;

      upsertDtos.push(
        ...bucketedDates.map((bucket) => ({
          granularity: bucket.granularity,
          timeBucket: bucket.dateGranular,
          value,
          operation: dto.operation,
          metricRegisterEntryId: dto.metricRegisterEntryId,
          projectId: dto.projectId,
        })),
      );
    }

    // save metrics
    await this.metricWriteService.upsertMany(upsertDtos);

    // create a mapping from register entry ID to metric name
    const metricRegisterIdToNameMap = new Map<string, string>();
    for (const dto of enrichedDtos) {
      metricRegisterIdToNameMap.set(dto.metricRegisterEntryId, dto.name);
    }

    // emit metric events directly from simplified metrics
    const metricEvents: MetricCreatedEvent[] = upsertDtos.map((metric) => ({
      metricRegisterEntryId: metric.metricRegisterEntryId,
      date:
        metric.granularity === MetricGranularity.AllTime
          ? 'all-time'
          : parseFlexibleDate(metric.timeBucket).toISOString(),
      name:
        metricRegisterIdToNameMap.get(metric.metricRegisterEntryId) ||
        'unknown',
      value: metric.value,
      granularity: metric.granularity,
      projectId: metric.projectId,
    }));

    if (metricEvents.length > 0) {
      this.metricEventEmitter.emitMetricCreatedEvents(metricEvents);
    }

    const durationMs = new Date().getTime() - now.getTime();

    if (
      durationMs > getEnvConfig().metrics.metricCreationDurationWarnThreshold
    ) {
      this.logger.warn(`Recorded metrics`, {
        durationMs,
      });
    }

    this.averageRecorder.record('metricsCreationDurationMs', durationMs);
  }
}
