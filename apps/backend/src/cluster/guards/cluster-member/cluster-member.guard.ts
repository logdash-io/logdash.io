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
import { PublicDashboardReadService } from '../../../public-dashboard/read/public-dashboard-read.service';
import { PublicDashboardReadModule } from '../../../public-dashboard/read/public-dashboard-read.module';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ROLE_KEY } from '../../decorators/require-cluster-role.decorator';
import { ClusterRole } from '../../core/enums/cluster-role.enum';
import { ClusterInviteReadService } from '../../../cluster-invite/read/cluster-invite-read.service';
import { ClusterInviteReadModule } from '../../../cluster-invite/read/cluster-invite-read.module';

const CLUSTER_ID_PARAM_NAME = 'clusterId';
const PROJECT_ID_PARAM_NAME = 'projectId';
const NOTIFICATION_CHANNEL_ID_PARAM_NAME = 'notificationChannelId';
const HTTP_MONITOR_ID_PARAM_NAME = 'httpMonitorId';
const PUBLIC_DASHBOARD_ID_PARAM_NAME = 'publicDashboardId';
const CLUSTER_INVITE_ID_PARAM_NAME = 'clusterInviteId';

export const ClusterMemberGuardImports = [
  ClusterReadModule,
  ProjectReadModule,
  NotificationChannelReadModule,
  HttpMonitorReadModule,
  PublicDashboardReadModule,
  ClusterInviteReadModule,
];

@Injectable()
export class ClusterMemberGuard implements CanActivate {
  constructor(
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly clusterInviteReadService: ClusterInviteReadService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles =
      this.reflector.getAllAndOverride<ClusterRole[]>(REQUIRE_ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? Object.values(ClusterRole);

    const request = context.switchToHttp().getRequest();

    const userId = request.user?.id;

    const clusterIdFromParams = request.params[CLUSTER_ID_PARAM_NAME];
    const projectIdFromParams = request.params[PROJECT_ID_PARAM_NAME];
    const notificationChannelIdFromParams = request.params[NOTIFICATION_CHANNEL_ID_PARAM_NAME];
    const httpMonitorIdFromParams = request.params[HTTP_MONITOR_ID_PARAM_NAME];
    const publicDashboardIdFromParams = request.params[PUBLIC_DASHBOARD_ID_PARAM_NAME];
    const clusterInviteIdFromParams = request.params[CLUSTER_INVITE_ID_PARAM_NAME];

    if (
      projectIdFromParams === getEnvConfig().demo.projectId ||
      clusterIdFromParams === getEnvConfig().demo.clusterId
    ) {
      return true;
    }

    if (!userId) {
      throw new ForbiddenException('User ID not provided');
    }

    if (
      !clusterIdFromParams &&
      !projectIdFromParams &&
      !notificationChannelIdFromParams &&
      !httpMonitorIdFromParams &&
      !publicDashboardIdFromParams &&
      !clusterInviteIdFromParams
    ) {
      throw new ForbiddenException(
        'Cluster ID, project ID, communication channel ID, http monitor ID, public dashboard ID or cluster invite ID not provided',
      );
    }

    if (clusterIdFromParams) {
      return this.checkForClusterId({
        clusterId: clusterIdFromParams,
        userId,
        allowedRoles,
      });
    }

    if (projectIdFromParams) {
      return this.checkForProjectId({
        projectId: projectIdFromParams,
        userId,
        allowedRoles,
      });
    }

    if (notificationChannelIdFromParams) {
      return this.checkForNotificationChannelId({
        notificationChannelId: notificationChannelIdFromParams,
        userId,
        allowedRoles,
      });
    }

    if (httpMonitorIdFromParams) {
      return this.checkForHttpMonitorId({
        httpMonitorId: httpMonitorIdFromParams,
        userId,
        allowedRoles,
      });
    }

    if (publicDashboardIdFromParams) {
      return this.checkForPublicDashboardId({
        publicDashboardId: publicDashboardIdFromParams,
        userId,
        allowedRoles,
      });
    }

    if (clusterInviteIdFromParams) {
      return this.checkForClusterInviteId({
        clusterInviteId: clusterInviteIdFromParams,
        userId,
        allowedRoles,
      });
    }

    throw new ForbiddenException('Invalid request');
  }

  private async checkForProjectId(dto: {
    projectId: string;
    userId: string;
    allowedRoles: ClusterRole[];
  }): Promise<boolean> {
    const project = await this.projectReadCachedService.readProject(dto.projectId);

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    const role = await this.clusterReadCachedService.readUserRole({
      clusterId: project.clusterId,
      userId: dto.userId,
    });

    if (!role) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    if (!dto.allowedRoles.includes(role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }

  private async checkForClusterId(dto: {
    clusterId: string;
    userId: string;
    allowedRoles: ClusterRole[];
  }): Promise<boolean> {
    const role = await this.clusterReadCachedService.readUserRole({
      clusterId: dto.clusterId,
      userId: dto.userId,
    });

    if (!role) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    if (!dto.allowedRoles.includes(role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }

  private async checkForNotificationChannelId(dto: {
    notificationChannelId: string;
    userId: string;
    allowedRoles: ClusterRole[];
  }): Promise<boolean> {
    const channel = await this.notificationChannelReadService.readById(dto.notificationChannelId);

    if (!channel) {
      throw new ForbiddenException('Communication channel not found');
    }

    const role = await this.clusterReadCachedService.readUserRole({
      clusterId: channel.clusterId,
      userId: dto.userId,
    });

    if (!role) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    if (!dto.allowedRoles.includes(role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }

  private async checkForHttpMonitorId(dto: {
    httpMonitorId: string;
    userId: string;
    allowedRoles: ClusterRole[];
  }): Promise<boolean> {
    const httpMonitor = await this.httpMonitorReadService.readById(dto.httpMonitorId);

    if (!httpMonitor) {
      throw new ForbiddenException('Http monitor not found');
    }

    const project = await this.projectReadCachedService.readProject(httpMonitor.projectId);

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    const role = await this.clusterReadCachedService.readUserRole({
      clusterId: project.clusterId,
      userId: dto.userId,
    });

    if (!role) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    if (!dto.allowedRoles.includes(role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }

  private async checkForPublicDashboardId(dto: {
    publicDashboardId: string;
    userId: string;
    allowedRoles: ClusterRole[];
  }): Promise<boolean> {
    const publicDashboard = await this.publicDashboardReadService.readById(dto.publicDashboardId);

    if (!publicDashboard) {
      throw new ForbiddenException('Public dashboard not found');
    }

    const role = await this.clusterReadCachedService.readUserRole({
      clusterId: publicDashboard.clusterId,
      userId: dto.userId,
    });

    if (!role) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    if (!dto.allowedRoles.includes(role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }

  private async checkForClusterInviteId(dto: {
    clusterInviteId: string;
    userId: string;
    allowedRoles: ClusterRole[];
  }): Promise<boolean> {
    const invite = await this.clusterInviteReadService.readById(dto.clusterInviteId);

    if (!invite) {
      throw new ForbiddenException('Cluster invite not found');
    }

    const cluster = await this.clusterReadCachedService.readById(invite.clusterId);

    if (!cluster) {
      throw new ForbiddenException('Cluster not found');
    }

    if (!dto.allowedRoles.includes(invite.role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }
}
