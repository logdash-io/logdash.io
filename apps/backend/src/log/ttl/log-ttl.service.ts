import { Injectable } from '@nestjs/common';
import { ProjectReadService } from '../../project/read/project-read.service';
import { LogWriteService } from '../write/log-write.service';
import { ProjectWriteService } from '../../project/write/project-write.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { Logger } from '@logdash/js-sdk';
import { subDays } from 'date-fns';
import { LogWriteClickhouseService } from '../write/log-write.clickhouse-service';
require('dotenv').config();

@Injectable()
export class LogTtlService {
  constructor(
    private readonly logWriteService: LogWriteClickhouseService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  public async removeOldLogs(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const now = new Date();
    await this.logWriteService.removePartition(subDays(now, 32));

    this.logger.log(`Removed old logs`, {
      durationInMs: new Date().getTime() - now.getTime(),
    });
  }
}
