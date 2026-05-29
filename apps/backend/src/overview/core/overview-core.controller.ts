import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { AccessRestriction } from '../../personal-api-key/core/types/access-restriction.type';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { ProjectNormalized } from '../../project/core/entities/project.interface';
import { OverviewReadService } from '../read/overview-read.service';
import { OverviewQuery } from './dto/overview.query';
import { OverviewResponse } from './dto/overview.response';
import { parseSince } from './since.util';

const DEFAULT_SINCE = '1h';

@ApiTags('Overview')
@Controller()
export class OverviewCoreController {
  constructor(
    private readonly overviewReadService: OverviewReadService,
    private readonly projectReadService: ProjectReadService,
    private readonly clusterReadService: ClusterReadService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Projects, Action.Read)
  @Get('projects/:projectId/overview')
  @ApiResponse({ type: OverviewResponse })
  public async projectOverview(
    @Param('projectId') projectId: string,
    @Query() query: OverviewQuery,
  ): Promise<OverviewResponse> {
    const since = parseSince(query.since ?? DEFAULT_SINCE);
    const project = await this.projectReadService.readByIdOrThrow(projectId);

    return this.overviewReadService.buildForProjects({ projects: [project], since });
  }

  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Clusters, Action.Read)
  @Get('clusters/:clusterId/overview')
  @ApiResponse({ type: OverviewResponse })
  public async clusterOverview(
    @Param('clusterId') clusterId: string,
    @Query() query: OverviewQuery,
  ): Promise<OverviewResponse> {
    const since = parseSince(query.since ?? DEFAULT_SINCE);
    const projects = await this.projectReadService.readByClusterId(clusterId);

    return this.overviewReadService.buildForProjects({ projects, since });
  }

  /**
   * Account-wide verdict. This endpoint has NO id param, so ClusterMemberGuard
   * does NOT run — the access-restriction check it would normally perform must
   * happen HERE, in the handler (ADR-0002). We fan out only over the projects
   * the credential can actually reach: live cluster membership ∩ the key's
   * access restriction. For JWT / `{kind:'all'}` the restriction is a no-op and
   * the bound is pure membership.
   */
  @ApiBearerAuth()
  @RequireScope(Resource.Clusters, Action.Read)
  @Get('overview')
  @ApiResponse({ type: OverviewResponse })
  public async accountOverview(
    @CurrentUserId() userId: string,
    @Query() query: OverviewQuery,
    @Req() request: Request,
  ): Promise<OverviewResponse> {
    const since = parseSince(query.since ?? DEFAULT_SINCE);

    const access: AccessRestriction | undefined = (request as any).user?.access;

    const projects = await this.resolveReachableProjects(userId, access);

    return this.overviewReadService.buildForProjects({ projects, since });
  }

  /**
   * Projects the credential can reach right now. Starts from the user's live
   * cluster memberships (mirrors GET /users/me/clusters), then narrows by the
   * personal key's access restriction. Never grants beyond membership.
   */
  private async resolveReachableProjects(
    userId: string,
    access: AccessRestriction | undefined,
  ): Promise<ProjectNormalized[]> {
    const clusters = await this.clusterReadService.readWhereUserHasAnyRole(userId);
    const memberClusterIds = clusters.map((cluster) => cluster.id);

    if (memberClusterIds.length === 0) {
      return [];
    }

    const allProjects = await this.projectReadService.readByClusterIds(memberClusterIds);

    if (!access || access.kind === 'all') {
      return allProjects;
    }

    if (access.kind === 'clusters') {
      const allowed = new Set(access.ids);
      return allProjects.filter((project) => allowed.has(project.clusterId));
    }

    if (access.kind === 'projects') {
      const allowed = new Set(access.ids);
      return allProjects.filter((project) => allowed.has(project.id));
    }

    return [];
  }
}
