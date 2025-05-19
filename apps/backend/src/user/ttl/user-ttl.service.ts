import { Injectable } from '@nestjs/common';
import { UserReadService } from '../read/user-read.service';
import { UserWriteService } from '../write/user-write.service';
import { subHours } from 'date-fns';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClusterRemovalService } from '../../cluster/removal/cluster-removal.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class UserTtlService {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly clusterRemovalService: ClusterRemovalService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async deleteOldUnclaimedUsers(): Promise<void> {
    const cutoffDate = subHours(
      new Date(),
      getEnvConfig().anonymousAccounts.removeAfterHours,
    );

    const cursor =
      this.userReadService.readUnclaimedUserIdsCreatedBeforeCursor(cutoffDate);

    for await (const userId of cursor) {
      try {
        await this.deleteUser(userId);
      } catch (e) {
        this.logger.error(`Failed to delete user`, {
          userId,
          error: e.message,
        });
      }
    }
  }

  private async deleteUser(userId: string): Promise<void> {
    this.logger.log(`Deleting user...`, {
      userId,
    });

    await this.userWriteService.delete(userId);

    this.logger.log(`Deleting clusters of user...`, {
      userId,
    });
    await this.clusterRemovalService.deleteClustersByCreatorId(userId);

    this.logger.log(`User and all his resources deleted`, {
      userId,
    });
  }
}
