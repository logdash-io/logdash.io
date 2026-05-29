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
import { CustomDomainReadService } from '../../../custom-domain/read/custom-domain-read.service';
import { CustomDomainReadModule } from '../../../custom-domain/read/custom-domain-read.module';
import { AccessRestriction } from '../../../personal-api-key/core/types/access-restriction.type';

const CLUSTER_ID_PARAM_NAME = 'clusterId';
const PROJECT_ID_PARAM_NAME = 'projectId';
const NOTIFICATION_CHANNEL_ID_PARAM_NAME = 'notificationChannelId';
const HTTP_MONITOR_ID_PARAM_NAME = 'httpMonitorId';
const PUBLIC_DASHBOARD_ID_PARAM_NAME = 'publicDashboardId';
const CLUSTER_INVITE_ID_PARAM_NAME = 'clusterInviteId';
const CUSTOM_DOMAIN_ID_PARAM_NAME = 'customDomainId';

export const ClusterMemberGuardImports = [
  ClusterReadModule,
  ProjectReadModule,
  NotificationChannelReadModule,
  HttpMonitorReadModule,
  PublicDashboardReadModule,
  ClusterInviteReadModule,
  CustomDomainReadModule,
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
    private readonly customDomainReadService: CustomDomainReadService,
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
    const access: AccessRestriction | undefined = request.user?.access;
    const viaPersonalKey: boolean | undefined = request.user?.viaPersonalKey;

    const clusterIdFromParams = request.params[CLUSTER_ID_PARAM_NAME];
    const projectIdFromParams = request.params[PROJECT_ID_PARAM_NAME];
    const notificationChannelIdFromParams = request.params[NOTIFICATION_CHANNEL_ID_PARAM_NAME];
    const httpMonitorIdFromParams = request.params[HTTP_MONITOR_ID_PARAM_NAME];
    const publicDashboardIdFromParams = request.params[PUBLIC_DASHBOARD_ID_PARAM_NAME];
    const clusterInviteIdFromParams = request.params[CLUSTER_INVITE_ID_PARAM_NAME];
    const customDomainIdFromParams = request.params[CUSTOM_DOMAIN_ID_PARAM_NAME];

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
      !clusterInviteIdFromParams &&
      !customDomainIdFromParams
    ) {
      throw new ForbiddenException(
        'Cluster ID, project ID, communication channel ID, http monitor ID, public dashboard ID, cluster invite ID or custom domain ID not provided',
      );
    }

    if (clusterIdFromParams) {
      return this.checkForClusterId({
        clusterId: clusterIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    if (projectIdFromParams) {
      return this.checkForProjectId({
        projectId: projectIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    if (notificationChannelIdFromParams) {
      return this.checkForNotificationChannelId({
        notificationChannelId: notificationChannelIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    if (httpMonitorIdFromParams) {
      return this.checkForHttpMonitorId({
        httpMonitorId: httpMonitorIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    if (publicDashboardIdFromParams) {
      return this.checkForPublicDashboardId({
        publicDashboardId: publicDashboardIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    if (clusterInviteIdFromParams) {
      return this.checkForClusterInviteId({
        clusterInviteId: clusterInviteIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    if (customDomainIdFromParams) {
      return this.checkForCustomDomainId({
        customDomainId: customDomainIdFromParams,
        userId,
        allowedRoles,
        access,
        viaPersonalKey,
      });
    }

    throw new ForbiddenException('Invalid request');
  }

  /**
   * Personal-API-key access restriction. Returns true for JWT/session users
   * (viaPersonalKey falsy) and for `{kind:'all'}` keys. For `{kind:'clusters'}`
   * the resolved clusterId must be in the allow-list; for `{kind:'projects'}`
   * the resolved projectId must be in the allow-list. A project-scoped key
   * therefore cannot reach a cluster-level endpoint (projectId undefined).
   */
  private accessAllows(
    access: AccessRestriction | undefined,
    viaPersonalKey: boolean | undefined,
    clusterId: string | undefined,
    projectId: string | undefined,
  ): boolean {
    if (!viaPersonalKey) {
      return true;
    }

    if (!access || access.kind === 'all') {
      return true;
    }

    if (access.kind === 'clusters') {
      return clusterId !== undefined && access.ids.includes(clusterId);
    }

    if (access.kind === 'projects') {
      return projectId !== undefined && access.ids.includes(projectId);
    }

    return false;
  }

  private assertAccessAllows(dto: {
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
    clusterId?: string;
    projectId?: string;
  }): void {
    if (!this.accessAllows(dto.access, dto.viaPersonalKey, dto.clusterId, dto.projectId)) {
      throw new ForbiddenException('Personal API key is not scoped to this cluster/project');
    }
  }

  private async checkForProjectId(dto: {
    projectId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
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

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: project.clusterId,
      projectId: dto.projectId,
    });

    return true;
  }

  private async checkForClusterId(dto: {
    clusterId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
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

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: dto.clusterId,
      projectId: undefined,
    });

    return true;
  }

  private async checkForNotificationChannelId(dto: {
    notificationChannelId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
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

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: channel.clusterId,
      projectId: undefined,
    });

    return true;
  }

  private async checkForHttpMonitorId(dto: {
    httpMonitorId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
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

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: project.clusterId,
      projectId: httpMonitor.projectId,
    });

    return true;
  }

  private async checkForPublicDashboardId(dto: {
    publicDashboardId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
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

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: publicDashboard.clusterId,
      projectId: undefined,
    });

    return true;
  }

  private async checkForClusterInviteId(dto: {
    clusterInviteId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
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

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: invite.clusterId,
      projectId: undefined,
    });

    return true;
  }

  private async checkForCustomDomainId(dto: {
    customDomainId: string;
    userId: string;
    allowedRoles: ClusterRole[];
    access?: AccessRestriction;
    viaPersonalKey?: boolean;
  }): Promise<boolean> {
    const customDomain = await this.customDomainReadService.readById(dto.customDomainId);

    if (!customDomain) {
      throw new ForbiddenException('Custom domain not found');
    }

    const publicDashboard = await this.publicDashboardReadService.readById(
      customDomain.publicDashboardId,
    );

    if (!publicDashboard) {
      throw new ForbiddenException('Public dashboard not found');
    }

    const role = await this.clusterReadCachedService.readUserRole({
      clusterId: publicDashboard.clusterId,
      userId: dto.userId,
    });

    if (!role || !dto.allowedRoles.includes(role)) {
      throw new ForbiddenException('User does not have the required role');
    }

    this.assertAccessAllows({
      access: dto.access,
      viaPersonalKey: dto.viaPersonalKey,
      clusterId: publicDashboard.clusterId,
      projectId: undefined,
    });

    return true;
  }
}
