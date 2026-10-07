import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { HttpMonitorLimitService } from '../limit/http-monitor-limit.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorWriteService } from '../write/http-monitor-write.service';
import { CreateHttpMonitorBody } from './dto/create-http-monitor.body';
import { HttpMonitorSerialized } from './entities/http-monitor.interface';
import { HttpMonitorSerializer } from './entities/http-monitor.serializer';
import { UpdateHttpMonitorBody } from './dto/update-http-monitor.body';
import { ProjectReadService } from '../../project/read/project-read.service';
import { HttpMonitorStatusService } from '../status/http-monitor-status.service';
import { HttpPingPingerService } from '../../http-ping/pinger/http-ping-pinger.service';
import { HttpPingPushService } from '../../http-ping/push/http-ping-push.service';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';
import { HttpMonitorRemovalService } from '../removal/http-monitor-removal.service';
import { HttpMonitorWatchlistService } from '../watchlist/http-monitor-watchlist.service';
import { NotificationChannelReadService } from '../../notification-channel/read/notification-channel-read.service';
import { Public } from '../../auth/core/decorators/is-public';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { PublicDashboardMonitorsService } from '../../public-dashboard/monitors/public-dashboard-monitors.service';
import { HttpMonitorMode } from './enums/http-monitor-mode.enum';
import {
  ThrottleMonitorCreation,
  ThrottleMonitorProbe,
  ThrottlePushPing,
} from '../../shared/throttling/rate-limit.decorator';
import { HttpMonitorProbeService } from '../probe/http-monitor-probe.service';
import { ProbeHttpMonitorUrlBody } from './dto/probe-http-monitor-url.body';
import { ProbeHttpMonitorUrlResponse } from './dto/probe-http-monitor-url.response';
import { SuggestHttpMonitorUrlsResponse } from './dto/suggest-http-monitor-urls.response';
import { NotificationChannelDefaultsService } from '../../notification-channel/defaults/notification-channel-defaults.service';

@ApiBearerAuth()
@ApiTags('Http Monitors')
@Controller('')
export class HttpMonitorCoreController {
  constructor(
    private readonly httpMonitorWriteService: HttpMonitorWriteService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorLimitService: HttpMonitorLimitService,
    private readonly projectReadService: ProjectReadService,
    private readonly httpMonitorStatusService: HttpMonitorStatusService,
    private readonly httpPingPingerService: HttpPingPingerService,
    private readonly httpPingPushService: HttpPingPushService,
    private readonly httpMonitorRemovalService: HttpMonitorRemovalService,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly httpMonitorWatchlistService: HttpMonitorWatchlistService,
    private readonly httpMonitorProbeService: HttpMonitorProbeService,
    private readonly notificationChannelDefaultsService: NotificationChannelDefaultsService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly publicDashboardMonitorsService: PublicDashboardMonitorsService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @ThrottleMonitorCreation()
  @Post('clusters/:clusterId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized })
  public async create(
    @Param('clusterId') clusterId: string,
    @Body() dto: CreateHttpMonitorBody,
    @CurrentUserId() userId: string,
  ): Promise<HttpMonitorSerialized> {
    return this.createMonitor({ clusterId }, dto, userId);
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @ThrottleMonitorCreation()
  @Post('projects/:projectId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized })
  public async createInProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateHttpMonitorBody,
    @CurrentUserId() userId: string,
  ): Promise<HttpMonitorSerialized> {
    const { clusterId } = await this.projectReadService.readByIdOrThrow(projectId);

    return this.createMonitor({ clusterId, projectId }, dto, userId);
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @ThrottleMonitorProbe()
  @HttpCode(200)
  @Post('clusters/:clusterId/http_monitors/probe')
  @ApiResponse({ type: ProbeHttpMonitorUrlResponse })
  public async probe(@Body() dto: ProbeHttpMonitorUrlBody): Promise<ProbeHttpMonitorUrlResponse> {
    return this.httpMonitorProbeService.probe(dto.url);
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @ThrottleMonitorProbe()
  @HttpCode(200)
  @Post('projects/:projectId/http_monitors/probe')
  @ApiResponse({ type: ProbeHttpMonitorUrlResponse })
  public async probeInProject(
    @Body() dto: ProbeHttpMonitorUrlBody,
  ): Promise<ProbeHttpMonitorUrlResponse> {
    return this.httpMonitorProbeService.probe(dto.url);
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Read)
  @ThrottleMonitorProbe()
  @HttpCode(200)
  @Post('clusters/:clusterId/http_monitors/suggestions')
  @ApiResponse({ type: SuggestHttpMonitorUrlsResponse })
  public async suggest(
    @Body() dto: ProbeHttpMonitorUrlBody,
  ): Promise<SuggestHttpMonitorUrlsResponse> {
    return { urls: await this.httpMonitorProbeService.suggest(dto.url) };
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Read)
  @Get('projects/:projectId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized, isArray: true })
  public async readByProjectId(
    @Param('projectId') projectId: string,
  ): Promise<HttpMonitorSerialized[]> {
    const httpMonitors = await this.httpMonitorReadService.readClaimedByProjectId(projectId);
    const statuses = await this.httpMonitorStatusService.getStatuses(
      httpMonitors.map((httpMonitor) => httpMonitor.id),
    );

    return HttpMonitorSerializer.serializeMany(httpMonitors, { statuses });
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Read)
  @Get('/clusters/:clusterId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized, isArray: true })
  public async readByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<HttpMonitorSerialized[]> {
    const httpMonitors = await this.httpMonitorReadService.readClaimedByClusterId(clusterId);

    const statuses = await this.httpMonitorStatusService.getStatuses(
      httpMonitors.map((httpMonitor) => httpMonitor.id),
    );

    return HttpMonitorSerializer.serializeMany(httpMonitors, { statuses });
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @Put('/http_monitors/:httpMonitorId')
  @ApiResponse({ type: HttpMonitorSerialized })
  public async update(
    @Param('httpMonitorId') httpMonitorId: string,
    @Body() dto: UpdateHttpMonitorBody,
    @CurrentUserId() userId: string,
  ): Promise<HttpMonitorSerialized> {
    const { clusterId, notificationChannelsIds, mode } =
      await this.httpMonitorReadService.readByIdOrThrow(httpMonitorId);

    if (dto.mode === HttpMonitorMode.Push && mode !== HttpMonitorMode.Push) {
      await this.assertPushMonitorsAllowed(clusterId);
    }

    await this.validateNotificationChannels({
      notificationChannelsIds: dto.notificationChannelsIds?.filter(
        (notificationChannelId) => !notificationChannelsIds.includes(notificationChannelId),
      ),
      clusterId,
    });

    const httpMonitor = await this.httpMonitorWriteService.update(httpMonitorId, dto, userId);

    const status = await this.httpMonitorStatusService.getStatus(httpMonitor.id);

    return HttpMonitorSerializer.serialize(httpMonitor, status);
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Delete)
  @Delete('/http_monitors/:httpMonitorId')
  public async delete(
    @Param('httpMonitorId') httpMonitorId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.httpMonitorRemovalService.deleteById(httpMonitorId, userId);
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @Post('/http_monitors/:httpMonitorId/notification_channels/:notificationChannelId')
  public async addNotificationChannel(
    @Param('httpMonitorId') httpMonitorId: string,
    @Param('notificationChannelId') notificationChannelId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.validateNotificationChannels({
      notificationChannelsIds: [notificationChannelId],
      clusterId: (await this.httpMonitorReadService.readByIdOrThrow(httpMonitorId)).clusterId,
    });

    await this.httpMonitorWriteService.addNotificationChannel(
      httpMonitorId,
      notificationChannelId,
      userId,
    );
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @Delete('/http_monitors/:httpMonitorId/notification_channels/:notificationChannelId')
  public async removeNotificationChannel(
    @Param('httpMonitorId') httpMonitorId: string,
    @Param('notificationChannelId') notificationChannelId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.validateNotificationChannels({
      notificationChannelsIds: [notificationChannelId],
      clusterId: (await this.httpMonitorReadService.readByIdOrThrow(httpMonitorId)).clusterId,
    });

    await this.httpMonitorWriteService.removeNotificationChannel(
      httpMonitorId,
      notificationChannelId,
      userId,
    );
  }

  @Public()
  @ThrottlePushPing()
  @Post('/ping/:httpMonitorId')
  public async recordPing(@Param('httpMonitorId') httpMonitorId: string): Promise<void> {
    await this.httpPingPushService.record(httpMonitorId);
  }

  private async createMonitor(
    owner: { clusterId: string; projectId?: string },
    dto: CreateHttpMonitorBody,
    userId: string,
  ): Promise<HttpMonitorSerialized> {
    if (dto.mode === HttpMonitorMode.Push) {
      await this.assertPushMonitorsAllowed(owner.clusterId);
    }

    const hasCapacity = await this.httpMonitorLimitService.hasCapacity(owner.clusterId);
    if (!hasCapacity) {
      throw new ConflictException('You have reached the maximum number of monitors on your plan');
    }

    await this.validateNotificationChannels({
      notificationChannelsIds: dto.notificationChannelsIds,
      clusterId: owner.clusterId,
    });

    const httpMonitor = await this.httpMonitorWriteService.create(owner, dto, userId);
    await this.httpMonitorWatchlistService.inheritHistory(httpMonitor);
    const status = await this.httpMonitorStatusService.getStatus(httpMonitor.id);

    if (process.env.NODE_ENV !== 'test') {
      setTimeout(() => {
        void this.httpPingPingerService.pingSingleMonitor(httpMonitor.id);
      }, 1_000);
    }

    return HttpMonitorSerializer.serialize(httpMonitor, status);
  }

  private async assertPushMonitorsAllowed(clusterId: string): Promise<void> {
    const tier = await this.clusterReadCachedService.readTier(clusterId);

    if (!getClusterPlanConfig(tier).httpMonitors.canCreatePushMonitors) {
      throw new ForbiddenException('Push monitors are not available on your plan');
    }
  }

  private async validateNotificationChannels(params: {
    notificationChannelsIds?: string[];
    clusterId: string;
  }): Promise<void> {
    if (
      params.notificationChannelsIds &&
      !(await this.notificationChannelReadService.belongToCluster(
        params.notificationChannelsIds,
        params.clusterId,
      ))
    ) {
      throw new BadRequestException('Notification channels must belong to the same domain');
    }
  }

  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Monitors, Action.Write)
  @Post('/http_monitors/:httpMonitorId/claim')
  public async claim(
    @Param('httpMonitorId') httpMonitorId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const monitor = await this.httpMonitorReadService.readByIdOrThrow(httpMonitorId);

    if (monitor.claimed) {
      return;
    }

    const hasCapacity = await this.httpMonitorLimitService.hasClaimedCapacity(monitor.clusterId);
    if (!hasCapacity) {
      throw new ConflictException('You have reached the maximum number of monitors on your plan');
    }

    await this.httpMonitorWriteService.claim(httpMonitorId);
    await this.notificationChannelDefaultsService.attachDomainChannels(httpMonitorId, userId);
    await this.publicDashboardMonitorsService.addClaimedMonitor(monitor);
  }
}
