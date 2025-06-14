import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ProjectReadCachedService } from '../../../project/read/project-read-cached.service';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { ClusterReadCachedService } from '../../read/cluster-read-cached.service';
import { NotificationChannelReadService } from '../../../notification-channel/read/notification-channel-read.service';
import { ClusterReadModule } from '../../read/cluster-read.module';
import { ProjectReadModule } from '../../../project/read/project-read.module';
import { NotificationChannelReadModule } from '../../../notification-channel/read/notification-channel-read.module';
import { HttpMonitorReadService } from '../../../http-monitor/read/http-monitor-read.service';
import { HttpMonitorReadModule } from '../../../http-monitor/read/http-monitor-read.module';

const CLUSTER_ID_PARAM_NAME = 'clusterId';
const PROJECT_ID_PARAM_NAME = 'projectId';
const NOTIFICATION_CHANNEL_ID_PARAM_NAME = 'notificationChannelId';
const HTTP_MONITOR_ID_PARAM_NAME = 'httpMonitorId';

export const ClusterMemberGuardImports = [
  ClusterReadModule,
  ProjectReadModule,
  NotificationChannelReadModule,
  HttpMonitorReadModule,
];

@Injectable()
export class ClusterMemberGuard implements CanActivate {
  constructor(
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = request.user?.id;

    const clusterIdFromParams = request.params[CLUSTER_ID_PARAM_NAME];
    const projectIdFromParams = request.params[PROJECT_ID_PARAM_NAME];
    const notificationChannelIdFromParams = request.params[NOTIFICATION_CHANNEL_ID_PARAM_NAME];
    const httpMonitorIdFromParams = request.params[HTTP_MONITOR_ID_PARAM_NAME];

    if (projectIdFromParams === getEnvConfig().demo.projectId) {
      return true;
    }

    if (!userId) {
      throw new ForbiddenException('User ID not provided');
    }

    if (
      !clusterIdFromParams &&
      !projectIdFromParams &&
      !notificationChannelIdFromParams &&
      !httpMonitorIdFromParams
    ) {
      throw new ForbiddenException(
        'Cluster ID, project ID, communication channel ID or http monitor ID not provided',
      );
    }

    if (clusterIdFromParams) {
      return this.checkForClusterId({
        clusterId: clusterIdFromParams,
        userId,
      });
    }

    if (projectIdFromParams) {
      return this.checkForProjectId({
        projectId: projectIdFromParams,
        userId,
      });
    }

    if (notificationChannelIdFromParams) {
      return this.checkForNotificationChannelId({
        notificationChannelId: notificationChannelIdFromParams,
        userId,
      });
    }

    if (httpMonitorIdFromParams) {
      return this.checkForHttpMonitorId({
        httpMonitorId: httpMonitorIdFromParams,
        userId,
      });
    }

    throw new ForbiddenException('Invalid request');
  }

  private async checkForProjectId(dto: { projectId: string; userId: string }): Promise<boolean> {
    const project = await this.projectReadCachedService.readProject(dto.projectId);

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    const isMember = await this.clusterReadCachedService.userIsMember({
      clusterId: project.clusterId,
      userId: dto.userId,
    });

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    return true;
  }

  private async checkForClusterId(dto: { clusterId: string; userId: string }): Promise<boolean> {
    const isMember = await this.clusterReadCachedService.userIsMember({
      clusterId: dto.clusterId,
      userId: dto.userId,
    });

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    return true;
  }

  private async checkForNotificationChannelId(dto: {
    notificationChannelId: string;
    userId: string;
  }): Promise<boolean> {
    const channel = await this.notificationChannelReadService.readById(dto.notificationChannelId);

    if (!channel) {
      throw new ForbiddenException('Communication channel not found');
    }

    const isMember = await this.clusterReadCachedService.userIsMember({
      clusterId: channel.clusterId,
      userId: dto.userId,
    });

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    return true;
  }

  private async checkForHttpMonitorId(dto: {
    httpMonitorId: string;
    userId: string;
  }): Promise<boolean> {
    const httpMonitor = await this.httpMonitorReadService.readById(dto.httpMonitorId);

    if (!httpMonitor) {
      throw new ForbiddenException('Http monitor not found');
    }

    const project = await this.projectReadCachedService.readProject(httpMonitor.projectId);

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    const isMember = await this.clusterReadCachedService.userIsMember({
      clusterId: project.clusterId,
      userId: dto.userId,
    });

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    return true;
  }
}
