import { Logger } from '@logdash/js-sdk';
import { Controller } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClickhouseO11yService } from './clickhouse-o11y.service';

@Controller('clickhouse-o11y')
export class ClickhouseO11yController {
  constructor(
    private readonly clickhouseO11yService: ClickhouseO11yService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async reportMetrics() {
    this.logger.log('Starting ClickHouse metrics collection...');
    await this.clickhouseO11yService.collectAndReportMetrics();
  }
}
