import { Inject, Injectable } from '@nestjs/common';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { LogdashMetrics } from '../../shared/logdash/aggregate-metrics';
import { LOGDASH_METRICS, LOGS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';
import { LogIndexingService } from '../indexing/log-indexing.service';
import { CreateLogDto } from '../write/dto/create-log.dto';
import { LogWriteService } from '../write/log-write.service';
@Injectable()
export class LogIngestionService {
  constructor(
    private readonly logIndexingService: LogIndexingService,
    @Inject(LOGS_LOGGER) private readonly logger: LogdashLogger,
    @Inject(LOGDASH_METRICS) private readonly metrics: LogdashMetrics,
    private readonly averageRecorder: AverageRecorder,
    private readonly logWriteClickhouseService: LogWriteService,
  ) {}

  public async createLogs(dtos: CreateLogDto[]): Promise<void> {
    const enrichedCreateDtos = await this.logIndexingService.enrichWithIndexes(dtos);

    const currentTime = Date.now();

    try {
      await this.logWriteClickhouseService.createMany(enrichedCreateDtos);
    } catch (error) {
      this.logger.error('Error creating logs', { errorMessage: error.message });
    }

    const durationInMs = Date.now() - currentTime;

    if (durationInMs > getEnvConfig().logging.logCreationDurationWarnThreshold) {
      this.logger.warn(`Created logs`, {
        count: dtos.length,
        durationInMs,
      });
    }

    this.metrics.mutateMetric('logsCreated', dtos.length);
    this.averageRecorder.record('logsCreationDurationMs', durationInMs);
  }
}
