import {
  Body,
  Controller,
  Get,
  Post,
  BadRequestException,
  Patch,
  Param,
  NotFoundException,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClusterWriteService } from '../write/cluster-write.service';
import { CreateClusterBody } from './dto/create-cluster.body';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ClusterSerialized } from './entities/cluster.interface';
import { ClusterSerializer } from './entities/cluster.serializer';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterReadService } from '../read/cluster-read.service';
import { UserReadCachedService } from '../../user/read/user-read-cached.service';
import { clusterTierFromUserTier } from './enums/cluster-tier.enum';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ClusterFeaturesService } from '../features/cluster-features.service';
import { ClusterReadCachedService } from '../read/cluster-read-cached.service';
import { UpdateClusterBody } from './dto/update-cluster.body';
import { ClusterMemberGuard } from '../guards/cluster-member/cluster-member.guard';

@ApiTags('Clusters')
@Controller()
export class ClusterCoreController {
  constructor(
    private readonly clusterWriteService: ClusterWriteService,
    private readonly clusterReadService: ClusterReadService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly userReadCachedService: UserReadCachedService,
    private readonly projectReadService: ProjectReadService,
    private readonly clusterFeaturesService: ClusterFeaturesService,
  ) {}

  @ApiBearerAuth()
  @Post('users/me/clusters')
  @ApiResponse({ type: ClusterSerialized })
  public async create(
    @Body() body: CreateClusterBody,
    @CurrentUserId() userId: string,
  ): Promise<ClusterSerialized> {
    const MAX_CLUSTERS_PER_USER = 100;
    const currentClusterCount =
      await this.clusterReadCachedService.countByCreatorId(userId);

    if (currentClusterCount >= MAX_CLUSTERS_PER_USER) {
      throw new BadRequestException(
        'Cannot create more clusters. Maximum limit of 100 clusters per user has been reached.',
      );
    }

    const userTier = await this.userReadCachedService.readTier(userId);
    const clusterTier = clusterTierFromUserTier(userTier);

    const cluster = await this.clusterWriteService.create({
      creatorId: userId,
      name: body.name,
      tier: clusterTier,
    });

    return ClusterSerializer.serialize(cluster);
  }

  @ApiBearerAuth()
  @Get('users/me/clusters')
  @ApiResponse({ type: ClusterSerialized, isArray: true })
  public async getAll(
    @CurrentUserId() userId: string,
  ): Promise<ClusterSerialized[]> {
    const clusters =
      await this.clusterReadService.readWhereUserIsInMembers(userId);

    const projectsGroupedByCluster =
      await this.projectReadService.readGroupedByClusterMany(
        clusters.map((cluster) => cluster.id),
      );

    const featuresMap =
      await this.clusterFeaturesService.getClusterFeaturesMany(
        clusters.map((cluster) => cluster.id),
      );

    return ClusterSerializer.serializeMany(clusters, {
      projectsMap: projectsGroupedByCluster,
      featuresMap,
    });
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Put('clusters/:clusterId')
  @ApiResponse({ type: ClusterSerialized })
  public async update(
    @Param('clusterId') clusterId: string,
    @Body() body: UpdateClusterBody,
    @CurrentUserId() userId: string,
  ): Promise<ClusterSerialized> {
    const cluster = await this.clusterReadService.readById(clusterId);

    if (!cluster) {
      throw new NotFoundException('Cluster not found');
    }

    if (cluster.creatorId !== userId) {
      throw new BadRequestException(
        'Cannot update cluster. User is not the creator of this cluster.',
      );
    }

    await this.clusterWriteService.update({
      id: clusterId,
      name: body.name,
    });

    const updatedCluster = await this.clusterReadService.readById(clusterId);

    if (!updatedCluster) {
      throw new NotFoundException('Cluster not found after update');
    }

    const projectsGroupedByCluster =
      await this.projectReadService.readGroupedByClusterMany([clusterId]);

    const featuresMap =
      await this.clusterFeaturesService.getClusterFeaturesMany([clusterId]);

    return ClusterSerializer.serialize(updatedCluster, {
      projects: projectsGroupedByCluster[clusterId],
      features: featuresMap[clusterId],
    });
  }
}
