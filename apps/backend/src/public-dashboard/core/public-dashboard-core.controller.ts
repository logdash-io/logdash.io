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
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { PublicDashboardWriteService } from '../write/public-dashboard-write.service';
import { PublicDashboardRemovalService } from '../removal/public-dashboard-removal.service';
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
import { UpdatePublicDashboardBody } from './dto/update-public-dashboard.body';
import { PublicDashboardLimitService } from '../limit/public-dashboard-limit.service';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { CustomDomainReadService } from '../../custom-domain/read/custom-domain-read.service';
import { CustomDomainSerializer } from '../../custom-domain/core/entities/custom-domain.serializer';

@ApiTags('Public Dashboards')
@Controller()
export class PublicDashboardCoreController {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
    private readonly publicDashboardRemovalService: PublicDashboardRemovalService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly projectReadService: ProjectReadService,
    private readonly publicDashboardCompositionService: PublicDashboardCompositionService,
    private readonly publicDashboardLimitService: PublicDashboardLimitService,
    private readonly customDomainReadService: CustomDomainReadService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Post('/clusters/:clusterId/public_dashboards')
  public async create(
    @Param('clusterId') clusterId: string,
    @Body() body: CreatePublicDashboardBody,
    @CurrentUserId() userId: string,
  ): Promise<PublicDashboardSerialized> {
    const hasCapacity = await this.publicDashboardLimitService.hasCapacity(userId);

    if (!hasCapacity) {
      throw new BadRequestException(
        'You have reached the maximum number of public dashboards allowed for your plan',
      );
    }

    const dashboard = await this.publicDashboardWriteService.create({
      clusterId,
      httpMonitorsIds: body.httpMonitorsIds,
      name: body.name,
      isPublic: body.isPublic,
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
  @Put('/public_dashboards/:publicDashboardId')
  public async update(
    @Param('publicDashboardId') publicDashboardId: string,
    @Body() body: UpdatePublicDashboardBody,
  ): Promise<PublicDashboardSerialized> {
    const dashboard = await this.publicDashboardWriteService.update({
      id: publicDashboardId,
      name: body.name,
      isPublic: body.isPublic,
    });

    await this.publicDashboardCompositionService.invalidateCache(publicDashboardId);

    return PublicDashboardSerializer.serialize(dashboard);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Delete('/public_dashboards/:publicDashboardId')
  public async delete(
    @Param('publicDashboardId') publicDashboardId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const dashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    await this.publicDashboardRemovalService.deletePublicDashboardById(publicDashboardId, userId);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/public_dashboards')
  @ApiResponse({ type: PublicDashboardSerialized, isArray: true })
  public async readByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<PublicDashboardSerialized[]> {
    const dashboards = await this.publicDashboardReadService.readByClusterId(clusterId);

    const customDomains = (
      await Promise.all(
        dashboards.map((dashboard) =>
          this.customDomainReadService.readByPublicDashboardId(dashboard.id),
        ),
      )
    ).filter((customDomain) => customDomain !== null);

    return PublicDashboardSerializer.serializeMany(dashboards, {
      customDomains: customDomains.map((customDomain) =>
        CustomDomainSerializer.serialize(customDomain),
      ),
    });
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('/public_dashboards/:publicDashboardId')
  @ApiResponse({ type: PublicDashboardSerialized })
  public async readById(
    @Param('publicDashboardId') publicDashboardId: string,
  ): Promise<PublicDashboardSerialized> {
    const dashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    const customDomain =
      await this.customDomainReadService.readByPublicDashboardId(publicDashboardId);

    return PublicDashboardSerializer.serialize(dashboard, {
      customDomain: customDomain ? CustomDomainSerializer.serialize(customDomain) : undefined,
    });
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

    await this.publicDashboardCompositionService.invalidateCache(publicDashboardId);

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

    await this.publicDashboardCompositionService.invalidateCache(publicDashboardId);

    const updatedDashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!updatedDashboard) {
      throw new NotFoundException('Public dashboard not found after update');
    }

    return PublicDashboardSerializer.serialize(updatedDashboard);
  }
}
