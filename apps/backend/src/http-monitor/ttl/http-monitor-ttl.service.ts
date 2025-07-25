import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subMinutes } from 'date-fns';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorRemovalService } from '../removal/http-monitor-removal.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class HttpMonitorTtlService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorRemovalService: HttpMonitorRemovalService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async runCron(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await this.deleteOldUnclaimedMonitors();
  }

  public async deleteOldUnclaimedMonitors(): Promise<void> {
    const cutoffDate = subMinutes(new Date(), 10);
    const unclaimedMonitors = await this.httpMonitorReadService.readUnclaimedOlderThan(cutoffDate);

    for (const monitor of unclaimedMonitors) {
      try {
        await this.httpMonitorRemovalService.deleteById(monitor.id);
        this.logger.log('Deleted unclaimed monitor', {
          httpMonitorId: monitor.id,
          projectId: monitor.projectId,
        });
      } catch (error) {
        this.logger.error('Failed to delete unclaimed monitor', {
          httpMonitorId: monitor.id,
          error: error.message,
        });
      }
    }
  }
}
