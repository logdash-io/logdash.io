import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { ApiKeyWriteService } from '../../api-key/write/api-key-write.service';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { LogRateLimitService } from '../../log/rate-limit/log-rate-limit.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { RateLimitScope } from '../../shared/enums/rate-limit-scope.enum';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';
import { ProjectFeaturesService } from '../features/project-features.service';
import { ProjectLimitService } from '../limit/project-limit-service';
import { ProjectReadService } from '../read/project-read.service';
import { ProjectRemovalService } from '../removal/project-removal.service';
import { ProjectWriteService } from '../write/project-write.service';
import { CreateProjectBody } from './dto/create-project.body';
import { CreateProjectResponse } from './dto/create-project.response';
import { UpdateProjectBody } from './dto/update-project.body';
import { ProjectSerialized } from './entities/project.interface';
import { ProjectSerializer } from './entities/project.serializer';
import { projectTierFromUserTier } from './enums/project-tier.enum';
import { ProjectCoreService } from './project-core.service';

@Controller('')
@ApiTags('Projects')
@ApiBearerAuth()
export class ProjectCoreController {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
    private readonly apiKeyWriteService: ApiKeyWriteService,
    private readonly projectLimitService: ProjectLimitService,
    private readonly userReadCachedService: UserReadCachedService,
    private readonly projectFeaturesService: ProjectFeaturesService,
    private readonly logRateLimitService: LogRateLimitService,
    private readonly projectRemovalService: ProjectRemovalService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @Get('projects/:projectId')
  @ApiResponse({ type: ProjectSerialized })
  public async readById(@Param('projectId') projectId: string): Promise<ProjectSerialized> {
    const project = await this.projectReadService.readById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const logsPerHourRateLimit = getProjectPlanConfig(project.tier).logs.rateLimitPerHour;

    const currentUsage = await this.logRateLimitService.readLogsCount(projectId);

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

    const featuresMap = await this.projectFeaturesService.getProjectFeaturesMany(
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
    const isWithinLimit = await this.projectLimitService.newProjectWouldBeWithinLimit(userId);

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

  @UseGuards(ClusterMemberGuard)
  @Delete('projects/:projectId')
  @ApiResponse({ type: SuccessResponse })
  public async delete(@Param('projectId') projectId: string): Promise<SuccessResponse> {
    await this.projectRemovalService.deleteProjectById(projectId);

    return new SuccessResponse();
  }
}
