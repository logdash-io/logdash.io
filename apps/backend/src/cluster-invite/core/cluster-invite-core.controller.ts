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
import { ClusterInviteLimitService } from '../limit/cluster-invite-limit.service';
import { ClusterInviteCapacityResponse } from './dto/cluster-invite-capacity.response';

@ApiTags('Cluster Invites')
@Controller()
export class ClusterInviteCoreController {
  constructor(
    private readonly clusterInviteWriteService: ClusterInviteWriteService,
    private readonly clusterInviteReadService: ClusterInviteReadService,
    private readonly clusterWriteService: ClusterWriteService,
    private readonly userReadService: UserReadService,
    private readonly clusterInviteLimitService: ClusterInviteLimitService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Post('clusters/:clusterId/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized })
  public async create(
    @Body() body: CreateClusterInviteBody,
    @CurrentUserId() userId: string,
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteSerialized> {
    await this.userReadService.readByIdOrThrow(body.invitedUserId);

    const existingInvite = await this.clusterInviteReadService.findExistingInvite({
      invitedUserId: body.invitedUserId,
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
      invitedUserId: body.invitedUserId,
      clusterId,
      role: body.role,
    });

    return ClusterInviteSerializer.serialize(invite);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized, isArray: true })
  public async getByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteSerialized[]> {
    const invites = await this.clusterInviteReadService.readByClusterId(clusterId);
    return ClusterInviteSerializer.serializeMany(invites);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/cluster_invites/capacity')
  @ApiResponse({ type: ClusterInviteCapacityResponse })
  public async getCapacity(
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteCapacityResponse> {
    const capacity = await this.clusterInviteLimitService.getCapacity(clusterId);
    return capacity;
  }

  @ApiBearerAuth()
  @Get('users/me/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized, isArray: true })
  public async getByInvitedUserId(
    @CurrentUserId() userId: string,
  ): Promise<ClusterInviteSerialized[]> {
    const invites = await this.clusterInviteReadService.readByInvitedUserId(userId);
    return ClusterInviteSerializer.serializeMany(invites);
  }

  @ApiBearerAuth()
  @Patch('cluster_invites/:inviteId/accept')
  @ApiResponse({ type: SuccessResponse })
  public async acceptInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUserId() userId: string,
  ): Promise<SuccessResponse> {
    const invite = await this.clusterInviteReadService.readById(inviteId);

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.invitedUserId !== userId) {
      throw new ForbiddenException('You can only accept invites sent to you');
    }

    await this.clusterWriteService.addRole(invite.clusterId, invite.invitedUserId, invite.role);

    return new SuccessResponse();
  }
}
