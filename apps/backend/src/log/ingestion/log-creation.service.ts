import { Logger, Metrics } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';
import { LogIndexingService } from '../indexing/log-indexing.service';
import { CreateLogDto } from '../write/dto/create-log.dto';
import { LogWriteService } from '../write/log-write.service';
@Injectable()
export class LogIngestionService {
  constructor(
    private readonly logIndexingService: LogIndexingService,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
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

    this.metrics.mutate('logsCreated', dtos.length);
    this.averageRecorder.record('logsCreationDurationMs', durationInMs);
  }
}
