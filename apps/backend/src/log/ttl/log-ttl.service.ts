import { Inject, Injectable } from '@nestjs/common';
import { LogWriteService } from '../write/log-write.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { LOGS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { subDays } from 'date-fns';
require('dotenv').config();

@Injectable()
export class LogTtlService {
  constructor(
    private readonly logWriteService: LogWriteService,
    @Inject(LOGS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  private async runCron(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const now = new Date();

    await this.removeOldLogs();

    this.logger.log(`Removed old logs`, {
      durationInMs: new Date().getTime() - now.getTime(),
    });
  }

  public async removeOldLogs(): Promise<void> {
    await this.logWriteService.removePartition(subDays(new Date(), 32));
  }
}
