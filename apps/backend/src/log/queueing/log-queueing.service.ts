import { Injectable } from '@nestjs/common';
import { CreateLogDto } from '../write/dto/create-log.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogIngestionService } from '../ingestion/log-creation.service';
import { QueueLogDto } from './dto/queue-log.dto';
import { Types } from 'mongoose';
import { QueueLogResult } from './dto/queue-log.result';
import { getOurEnv, OurEnv } from '../../shared/types/our-env.enum';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class LogQueueingService {
  private queuedDtos: CreateLogDto[] = [];

  constructor(
    private readonly logCreationService: LogIngestionService,
    private readonly logger: Logger,
  ) {}

  public queueLog(dto: QueueLogDto): QueueLogResult {
    const id = new Types.ObjectId().toString();

    this.queuedDtos.push({ ...dto, id });

    return {
      id,
    };
  }

  @Cron(CronExpression.EVERY_SECOND)
  public async processQueue(): Promise<void> {
    if (this.queuedDtos.length === 0) {
      return;
    }

    void this.logCreationService.createLogs(structuredClone(this.queuedDtos));
    this.queuedDtos = [];
  }

  @Cron(CronExpression.EVERY_SECOND)
  public async simulateOneSecondTraffic(): Promise<void> {
    if (process.env.NODE_ENV === 'test' || getOurEnv() === OurEnv.Prod) {
      return;
    }

    this.logger.log('Stress test log');
  }
}
