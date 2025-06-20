import { Injectable } from '@nestjs/common';
import { ProjectReadService } from '../../project/read/project-read.service';
import { LogWriteService } from '../write/log-write.service';
import { ProjectWriteService } from '../../project/write/project-write.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { Logger } from '@logdash/js-sdk';
require('dotenv').config();

@Injectable()
export class LogTtlService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
    private readonly logWriteService: LogWriteService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
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
    const candidates = await this.projectReadService.getProjectForLogRemovalCursor();

    for await (const candidate of candidates) {
      const limit = getProjectPlanConfig(candidate.tier).logs.keepLastXLogs;

      if (Math.abs(candidate.currentIndex - candidate.lastDeletionIndex) > limit + 500) {
        const cutoffIndex = candidate.currentIndex - limit;

        this.logger.log(`Removing logs for project`, {
          projectId: candidate.projectId,
          currentIndex: candidate.currentIndex,
          lastDeletionIndex: candidate.lastDeletionIndex,
          cutoffIndex,
        });

        await this.logWriteService.removeForProjectWithIndexLessThan(
          candidate.projectId,
          cutoffIndex,
        );

        await this.projectWriteService.updateLastDeletionIndex(
          candidate.projectId,
          candidate.lastDeletionIndex,
        );
      }
    }
  }
}
