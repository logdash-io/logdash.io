import {
  Body,
  Controller,
  Get,
  Post,
  BadRequestException,
  Param,
  NotFoundException,
  UseGuards,
  Patch,
  ForbiddenException,
  Delete,
  Put,
} from '@nestjs/common';
import { ClusterInviteWriteService } from '../write/cluster-invite-write.service';
import { CreateClusterInviteBody } from './dto/create-invite.body';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ClusterInviteSerialized } from './entities/cluster-invite.interface';
import { ClusterInviteSerializer } from './entities/cluster-invite.serializer';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterInviteReadService } from '../read/cluster-invite-read.service';
import { UserReadService } from '../../user/read/user-read.service';
import { SuccessResponse } from '../../shared/responses/success.response';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { ClusterWriteService } from '../../cluster/write/cluster-write.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { ClusterInviteLimitService } from '../limit/cluster-invite-limit.service';
import { ClusterInviteCapacityResponse } from './dto/cluster-invite-capacity.response';
import { RequireRole } from '../../cluster/decorators/require-cluster-role.decorator';
import { ClusterRole } from '../../cluster/core/enums/cluster-role.enum';
import { getUserPlanConfig } from '../../shared/configs/user-plan-configs';

@ApiTags('Cluster Invites')
@Controller()
export class ClusterInviteCoreController {
  constructor(
    private readonly clusterInviteWriteService: ClusterInviteWriteService,
    private readonly clusterInviteReadService: ClusterInviteReadService,
    private readonly clusterWriteService: ClusterWriteService,
    private readonly clusterReadService: ClusterReadService,
    private readonly userReadService: UserReadService,
    private readonly clusterInviteLimitService: ClusterInviteLimitService,
  ) {}

  @RequireRole(ClusterRole.Creator)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Post('clusters/:clusterId/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized })
  public async create(
    @Body() body: CreateClusterInviteBody,
    @CurrentUserId() userId: string,
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteSerialized> {
    const existingInvite = await this.clusterInviteReadService.findExistingInvite({
      invitedUserEmail: body.email,
      clusterId,
    });

    if (existingInvite) {
      throw new BadRequestException('User is already invited to this cluster');
    }

    const hasCapacity = await this.clusterInviteLimitService.hasCapacity(clusterId);

    if (!hasCapacity) {
      throw new BadRequestException('Cluster is at capacity');
    }

    const invite = await this.clusterInviteWriteService.create({
      inviterUserId: userId,
      invitedUserEmail: body.email,
      clusterId,
      role: body.role,
    });

    const cluster = await this.clusterReadService.readById(clusterId);
    return ClusterInviteSerializer.serialize(invite, cluster?.name);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized, isArray: true })
  public async getByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteSerialized[]> {
    const invites = await this.clusterInviteReadService.readByClusterId(clusterId);
    const cluster = await this.clusterReadService.readById(clusterId);
    const clusterNames = cluster ? { [clusterId]: cluster.name } : {};
    return ClusterInviteSerializer.serializeMany(invites, clusterNames);
  }

  @RequireRole(ClusterRole.Creator)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/cluster_invites/capacity')
  @ApiResponse({ type: ClusterInviteCapacityResponse })
  public async getCapacity(
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteCapacityResponse> {
    const capacity = await this.clusterInviteLimitService.getCapacity(clusterId);

    const roles = await this.clusterReadService.readMembers(clusterId);

    const members = await Promise.all(
      roles.map(async (member) => {
        const user = await this.userReadService.readByIdOrThrow(member.id);
        return {
          id: user.id,
          email: user.email,
          role: member.role,
          avatarUrl: user.avatarUrl,
        };
      }),
    );

    return {
      ...capacity,
      members,
    };
  }

  @ApiBearerAuth()
  @Get('users/me/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized, isArray: true })
  public async getByInvitedUserId(
    @CurrentUserId() userId: string,
  ): Promise<ClusterInviteSerialized[]> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    const invites = await this.clusterInviteReadService.readByInvitedUserEmail(user.email);

    const clusterIds = [...new Set(invites.map((invite) => invite.clusterId))];
    const clusterNames: Record<string, string> = {};

    for (const clusterId of clusterIds) {
      const cluster = await this.clusterReadService.readById(clusterId);
      if (cluster) {
        clusterNames[clusterId] = cluster.name;
      }
    }

    return ClusterInviteSerializer.serializeMany(invites, clusterNames);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Delete('cluster_invites/:clusterInviteId')
  @ApiResponse({ type: SuccessResponse })
  public async deleteInvite(
    @Param('clusterInviteId') clusterInviteId: string,
    @CurrentUserId() userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    const invite = await this.clusterInviteReadService.readById(clusterInviteId);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.inviterUserId !== userId && invite.invitedUserEmail !== user.email) {
      throw new ForbiddenException('You can only delete invites you have sent or received');
    }

    await this.clusterInviteWriteService.delete(clusterInviteId, userId);

    return new SuccessResponse();
  }

  @ApiBearerAuth()
  @Put('cluster_invites/:clusterInviteId/accept')
  @ApiResponse({ type: SuccessResponse })
  public async acceptInvite(
    @Param('clusterInviteId') clusterInviteId: string,
    @CurrentUserId() userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    const invite = await this.clusterInviteReadService.readById(clusterInviteId);

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.invitedUserEmail !== user.email) {
      throw new ForbiddenException('You can only accept invites sent to you');
    }

    const numberOfClusters = await this.clusterReadService.countBeingMemberOfClusters(user.id);

    if (numberOfClusters + 1 >= getUserPlanConfig(user.tier).projects.maxNumberOfProjects) {
      throw new BadRequestException('You are a member of too many clusters');
    }

    await this.clusterWriteService.addRole(invite.clusterId, user.id, invite.role);

    await this.clusterInviteWriteService.delete(clusterInviteId, userId);

    return new SuccessResponse();
  }
}
