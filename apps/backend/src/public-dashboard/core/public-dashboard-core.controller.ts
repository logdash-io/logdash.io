import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  NotFoundException,
  UseGuards,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { PublicDashboardWriteService } from '../write/public-dashboard-write.service';
import { PublicDashboardSerialized } from './entities/public-dashboard.interface';
import { PublicDashboardSerializer } from './entities/public-dashboard.serializer';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { CreatePublicDashboardBody } from './dto/create-public-dashboard.body';
import { ProjectReadService } from '../../project/read/project-read.service';
import { Public } from '../../auth/core/decorators/is-public';
import { PublicDashboardDataResponse } from './dto/public-dashboard-data.response';
import { PublicDashboardCompositionService } from '../composition/public-dashboard-composition.service';
import { PublicDashboardDataQuery } from './dto/public-dashboard-data.query';

@ApiTags('Public Dashboards')
@Controller()
export class PublicDashboardCoreController {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly projectReadService: ProjectReadService,
    private readonly publicDashboardCompositionService: PublicDashboardCompositionService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Post('/clusters/:clusterId/public_dashboards')
  public async createPublicDashboard(
    @Param('clusterId') clusterId: string,
    @Body() body: CreatePublicDashboardBody,
  ): Promise<PublicDashboardSerialized> {
    const dashboard = await this.publicDashboardWriteService.create({
      clusterId,
      httpMonitorsIds: body.httpMonitorsIds,
    });

    const monitors = await this.httpMonitorReadService.readManyByIds(dashboard.httpMonitorsIds);

    const projects = await this.projectReadService.readManyByIds(
      monitors.map((monitor) => monitor.projectId),
    );

    if (projects.some((project) => project.clusterId !== clusterId)) {
      throw new BadRequestException('Some monitors do not belong to the same cluster');
    }

    return PublicDashboardSerializer.serialize(dashboard);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/public_dashboards')
  @ApiResponse({ type: PublicDashboardSerialized, isArray: true })
  public async readByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<PublicDashboardSerialized[]> {
    const dashboards = await this.publicDashboardReadService.readByClusterId(clusterId);
    return PublicDashboardSerializer.serializeMany(dashboards);
  }

  @Public()
  @Get('/public_dashboards/:publicDashboardId/public_data')
  @ApiResponse({ type: PublicDashboardDataResponse })
  public async readPublicDashboardPublicData(
    @Param('publicDashboardId') publicDashboardId: string,
    @Query() query: PublicDashboardDataQuery,
  ): Promise<PublicDashboardDataResponse> {
    return this.publicDashboardCompositionService.composePublicResponse(
      publicDashboardId,
      query.period,
    );
  }

  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @Get('/public_dashboards/:publicDashboardId/data')
  @ApiResponse({ type: PublicDashboardDataResponse })
  public async readPublicDashboardData(
    @Param('publicDashboardId') publicDashboardId: string,
    @Query() query: PublicDashboardDataQuery,
  ): Promise<PublicDashboardDataResponse> {
    return this.publicDashboardCompositionService.composePrivateResponse(
      publicDashboardId,
      query.period,
    );
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Post('/public_dashboards/:publicDashboardId/monitors/:httpMonitorId')
  @ApiResponse({ type: PublicDashboardSerialized })
  public async addMonitorToDashboard(
    @Param('publicDashboardId') publicDashboardId: string,
    @Param('httpMonitorId') httpMonitorId: string,
  ): Promise<PublicDashboardSerialized> {
    const dashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    const monitor = await this.httpMonitorReadService.readById(httpMonitorId);

    if (!monitor) {
      throw new NotFoundException('Http monitor not found');
    }

    const project = await this.projectReadService.readById(monitor.projectId);

    if (project?.clusterId !== dashboard.clusterId) {
      throw new NotFoundException('Monitor does not belong to the same cluster');
    }

    await this.publicDashboardWriteService.addMonitorToDashboard({
      publicDashboardId: publicDashboardId,
      httpMonitorId: httpMonitorId,
    });

    const updatedDashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!updatedDashboard) {
      throw new NotFoundException('Public dashboard not found after update');
    }

    return PublicDashboardSerializer.serialize(updatedDashboard);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Delete('/public_dashboards/:publicDashboardId/monitors/:httpMonitorId')
  @ApiResponse({ type: PublicDashboardSerialized })
  public async removeMonitorFromDashboard(
    @Param('publicDashboardId') publicDashboardId: string,
    @Param('httpMonitorId') httpMonitorId: string,
  ): Promise<PublicDashboardSerialized> {
    const dashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    const monitor = await this.httpMonitorReadService.readById(httpMonitorId);

    if (!monitor) {
      throw new NotFoundException('Http monitor not found');
    }

    await this.publicDashboardWriteService.removeMonitorFromDashboard({
      publicDashboardId: publicDashboardId,
      httpMonitorId: httpMonitorId,
    });

    const updatedDashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!updatedDashboard) {
      throw new NotFoundException('Public dashboard not found after update');
    }

    return PublicDashboardSerializer.serialize(updatedDashboard);
  }
}
