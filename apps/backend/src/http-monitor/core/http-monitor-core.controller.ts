import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
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
import { DemoEndpoint } from 'src/demo/decorators/demo-endpoint.decorator';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';
import { HttpMonitorRemovalService } from '../removal/http-monitor-removal.service';
import { NotificationChannelReadService } from '../../notification-channel/read/notification-channel-read.service';
import { Public } from '../../auth/core/decorators/is-public';

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
  ) {}

  @UseGuards(ClusterMemberGuard)
  @Post('projects/:projectId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateHttpMonitorBody,
    @CurrentUserId() userId: string,
  ): Promise<HttpMonitorSerialized> {
    const hasCapacity = await this.httpMonitorLimitService.hasCapacity(projectId);
    if (!hasCapacity) {
      throw new ConflictException(
        'You have reached the maximum number of monitors for this project',
      );
    }

    await this.validateNotificationChannels({
      notificationChannelsIds: dto.notificationChannelsIds,
      projectId,
    });

    const httpMonitor = await this.httpMonitorWriteService.create(projectId, dto, userId);
    const status = await this.httpMonitorStatusService.getStatus(httpMonitor.id);

    if (process.env.NODE_ENV !== 'test') {
      void this.httpPingPingerService.pingSingleMonitor(httpMonitor.id);
    }

    return HttpMonitorSerializer.serialize(httpMonitor, status);
  }

  @UseGuards(ClusterMemberGuard)
  @Get('projects/:projectId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized, isArray: true })
  async readByProjectId(@Param('projectId') projectId: string): Promise<HttpMonitorSerialized[]> {
    const httpMonitors = await this.httpMonitorReadService.readByProjectId(projectId);
    const statuses = await this.httpMonitorStatusService.getStatuses(
      httpMonitors.map((httpMonitor) => httpMonitor.id),
    );

    return HttpMonitorSerializer.serializeMany(httpMonitors, { statuses });
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @Get('/clusters/:clusterId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized, isArray: true })
  async readByClusterId(@Param('clusterId') clusterId: string): Promise<HttpMonitorSerialized[]> {
    const projectsIdsInCluster = await this.projectReadService.readByClusterId(clusterId);

    const httpMonitors = await this.httpMonitorReadService.readByProjectIds(
      projectsIdsInCluster.map((project) => project.id),
    );

    const statuses = await this.httpMonitorStatusService.getStatuses(
      httpMonitors.map((httpMonitor) => httpMonitor.id),
    );

    return HttpMonitorSerializer.serializeMany(httpMonitors, { statuses });
  }

  @UseGuards(ClusterMemberGuard)
  @Put('/http_monitors/:httpMonitorId')
  @ApiResponse({ type: HttpMonitorSerialized })
  async update(
    @Param('httpMonitorId') httpMonitorId: string,
    @Body() dto: UpdateHttpMonitorBody,
    @CurrentUserId() userId: string,
  ): Promise<HttpMonitorSerialized> {
    const httpMonitor = await this.httpMonitorWriteService.update(httpMonitorId, dto, userId);

    const status = await this.httpMonitorStatusService.getStatus(httpMonitor.id);

    return HttpMonitorSerializer.serialize(httpMonitor, status);
  }

  @UseGuards(ClusterMemberGuard)
  @Delete('/http_monitors/:httpMonitorId')
  async delete(
    @Param('httpMonitorId') httpMonitorId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.httpMonitorRemovalService.deleteById(httpMonitorId, userId);
  }

  @UseGuards(ClusterMemberGuard)
  @Post('/http_monitors/:httpMonitorId/notification_channels/:notificationChannelId')
  async addNotificationChannel(
    @Param('httpMonitorId') httpMonitorId: string,
    @Param('notificationChannelId') notificationChannelId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.validateNotificationChannels({
      notificationChannelsIds: [notificationChannelId],
      projectId: (await this.httpMonitorReadService.readById(httpMonitorId))!.projectId,
    });

    await this.httpMonitorWriteService.addNotificationChannel(
      httpMonitorId,
      notificationChannelId,
      userId,
    );
  }

  @UseGuards(ClusterMemberGuard)
  @Delete('/http_monitors/:httpMonitorId/notification_channels/:notificationChannelId')
  async removeNotificationChannel(
    @Param('httpMonitorId') httpMonitorId: string,
    @Param('notificationChannelId') notificationChannelId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.validateNotificationChannels({
      notificationChannelsIds: [notificationChannelId],
      projectId: (await this.httpMonitorReadService.readById(httpMonitorId))!.projectId,
    });

    await this.httpMonitorWriteService.removeNotificationChannel(
      httpMonitorId,
      notificationChannelId,
      userId,
    );
  }

  @Public()
  @Post('/http_monitors/:httpMonitorId/push')
  async recordPing(@Param('httpMonitorId') httpMonitorId: string): Promise<void> {
    await this.httpPingPushService.record(httpMonitorId);
  }

  private async validateNotificationChannels(params: {
    notificationChannelsIds?: string[];
    projectId: string;
  }): Promise<void> {
    const clusterId = (await this.projectReadService.readById(params.projectId))!.clusterId;

    if (
      params.notificationChannelsIds &&
      !(await this.notificationChannelReadService.belongToCluster(
        params.notificationChannelsIds,
        clusterId,
      ))
    ) {
      throw new BadRequestException('Notification channels must belong to the same cluster');
    }
  }
}
