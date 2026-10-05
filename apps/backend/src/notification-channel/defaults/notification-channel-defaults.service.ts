import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpMonitorWriteService } from '../../http-monitor/write/http-monitor-write.service';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { UserReadService } from '../../user/read/user-read.service';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';
import { NotificationChannelWriteService } from '../write/notification-channel-write.service';
import { NotificationChannelType } from '../core/enums/notification-target.enum';
import { AuthEvents } from '../../auth/events/auth-events.enum';
import { AccountClaimedEvent } from '../../auth/events/definitions/account-claimed.event';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { NOTIFICATIONS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { errorMessage } from '../../shared/utils/error-message';

@Injectable()
export class NotificationChannelDefaultsService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorWriteService: HttpMonitorWriteService,
    private readonly projectReadService: ProjectReadService,
    private readonly clusterReadService: ClusterReadService,
    private readonly userReadService: UserReadService,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly notificationChannelWriteService: NotificationChannelWriteService,
    @Inject(NOTIFICATIONS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  public async attachOwnerEmail(httpMonitorId: string, userId: string): Promise<void> {
    const monitor = await this.httpMonitorReadService.readByIdOrThrow(httpMonitorId);

    if (monitor.notificationChannelsIds.length > 0) {
      return;
    }

    const user = await this.userReadService.readByIdOrThrow(userId);

    if (user.accountClaimStatus !== AccountClaimStatus.Claimed || !user.email) {
      return;
    }

    const project = await this.projectReadService.readByIdOrThrow(monitor.projectId);
    const channelId = await this.findOrCreateEmailChannel(project.clusterId, user.email, userId);

    await this.httpMonitorWriteService.addNotificationChannel(httpMonitorId, channelId, userId);
  }

  @OnEvent(AuthEvents.AccountClaimed)
  public async onAccountClaimed(event: AccountClaimedEvent): Promise<void> {
    try {
      const clusters = await this.clusterReadService.readByCreatorId(event.userId);
      const projects = await this.projectReadService.readByClusterIds(
        clusters.map((cluster) => cluster.id),
      );
      const monitors = await this.httpMonitorReadService.readClaimedByProjectIds(
        projects.map((project) => project.id),
      );

      for (const monitor of monitors) {
        await this.attachOwnerEmail(monitor.id, event.userId);
      }
    } catch (error) {
      this.logger.error('Failed to turn on email alerts for a claimed account', {
        userId: event.userId,
        error: errorMessage(error),
      });
    }
  }

  private async findOrCreateEmailChannel(
    clusterId: string,
    email: string,
    userId: string,
  ): Promise<string> {
    const existing = await this.notificationChannelReadService.readEmailChannel(clusterId, email);

    if (existing) {
      return existing.id;
    }

    const channel = await this.notificationChannelWriteService.create(
      { clusterId, type: NotificationChannelType.Email, name: email, options: { email } },
      userId,
    );

    return channel.id;
  }
}
