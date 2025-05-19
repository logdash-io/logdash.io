import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectReadService } from '../read/project-read.service';
import { ProjectSerialized } from './entities/project.interface';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ProjectSerializer } from './entities/project.serializer';
import { ProjectWriteService } from '../write/project-write.service';
import { UpdateProjectBody } from './dto/update-project.body';
import { CreateProjectBody } from './dto/create-project.body';
import { ApiKeyWriteService } from '../../api-key/write/api-key-write.service';
import { CreateProjectResponse } from './dto/create-project.response';
import { ProjectLimitService } from '../limit/project-limit-service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { ProjectCoreService } from './project-core.service';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';
import { projectTierFromUserTier } from './enums/project-tier.enum';
import { ProjectFeaturesService } from '../features/project-features.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { LogRateLimitService } from '../../log/rate-limit/log-rate-limit.service';
import { RateLimitScope } from '../../shared/enums/rate-limit-scope.enum';

@Controller('')
@ApiTags('Projects')
@ApiBearerAuth()
export class ProjectCoreController {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
    private readonly apiKeyWriteService: ApiKeyWriteService,
    private readonly projectLimitService: ProjectLimitService,
    private readonly projectCoreService: ProjectCoreService,
    private readonly userReadCachedService: UserReadCachedService,
    private readonly projectFeaturesService: ProjectFeaturesService,
    private readonly logRateLimitService: LogRateLimitService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @Get('projects/:projectId')
  @ApiResponse({ type: ProjectSerialized })
  public async readById(
    @Param('projectId') projectId: string,
  ): Promise<ProjectSerialized> {
    const project = await this.projectReadService.readById(projectId);

    const logsPerHourRateLimit = getProjectPlanConfig(project.tier).logs
      .rateLimitPerHour;

    const currentUsage =
      await this.logRateLimitService.readLogsCount(projectId);

    return ProjectSerializer.serialize(project, {
      rateLimits: [
        {
          scope: RateLimitScope.ProjectLogsPerHour,
          currentUsage,
          limit: logsPerHourRateLimit,
        },
      ],
    });
  }

  @UseGuards(ClusterMemberGuard)
  @Get('clusters/:clusterId/projects')
  @ApiResponse({ type: ProjectSerialized, isArray: true })
  public async readBelongingToCluster(
    @Param('clusterId') clusterId: string,
  ): Promise<ProjectSerialized[]> {
    const projects = await this.projectReadService.readByClusterId(clusterId);

    const featuresMap =
      await this.projectFeaturesService.getProjectFeaturesMany(
        projects.map((project) => project.id),
      );

    return ProjectSerializer.serializeMany(projects, { featuresMap });
  }

  @UseGuards(ClusterMemberGuard)
  @Put('projects/:projectId')
  public async update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectBody,
  ): Promise<void> {
    await this.projectWriteService.updateProject({
      id: projectId,
      name: dto.name,
    });
  }

  @UseGuards(ClusterMemberGuard)
  @Post('clusters/:clusterId/projects')
  @ApiResponse({ type: CreateProjectResponse })
  public async create(
    @CurrentUserId() userId,
    @Body() dto: CreateProjectBody,
    @Param('clusterId') clusterId: string,
  ): Promise<CreateProjectResponse> {
    const isWithinLimit =
      await this.projectLimitService.newProjectWouldBeWithinLimit(userId);

    if (!isWithinLimit) {
      throw new ConflictException('User has reached the project limit');
    }

    const userTier = await this.userReadCachedService.readTier(userId);
    const projectTier = projectTierFromUserTier(userTier);

    const project = await this.projectWriteService.create({
      name: dto.name,
      userId,
      clusterId,
      tier: projectTier,
    });

    const apiKey = await this.apiKeyWriteService.createApiKey({
      projectId: project.id,
    });

    const serialized = ProjectSerializer.serialize(project);

    return {
      project: serialized,
      apiKey: apiKey.value,
    };
  }
}
