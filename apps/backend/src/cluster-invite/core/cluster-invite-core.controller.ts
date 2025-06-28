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

@ApiTags('Cluster Invites')
@Controller()
export class ClusterInviteCoreController {
  constructor(
    private readonly clusterInviteWriteService: ClusterInviteWriteService,
    private readonly clusterInviteReadService: ClusterInviteReadService,
    private readonly userReadService: UserReadService,
  ) {}

  @ApiBearerAuth()
  @Post('clusters/:clusterId/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized })
  public async create(
    @Body() body: CreateClusterInviteBody,
    @CurrentUserId() userId: string,
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteSerialized> {
    const invitedUser = await this.userReadService.readById(body.invitedUserId);
    if (!invitedUser) {
      throw new NotFoundException('Invited user not found');
    }

    const existingInvite = await this.clusterInviteReadService.findExistingInvite({
      invitedUserId: body.invitedUserId,
      clusterId,
    });

    if (existingInvite) {
      throw new BadRequestException('User is already invited to this cluster');
    }

    const invite = await this.clusterInviteWriteService.create({
      inviterUserId: userId,
      invitedUserId: body.invitedUserId,
      clusterId,
    });

    return ClusterInviteSerializer.serialize(invite);
  }

  @ApiBearerAuth()
  @Get('clusters/:clusterId/cluster_invites')
  @ApiResponse({ type: ClusterInviteSerialized, isArray: true })
  public async getByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterInviteSerialized[]> {
    const invites = await this.clusterInviteReadService.readByClusterId(clusterId);
    return ClusterInviteSerializer.serializeMany(invites);
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
      throw new BadRequestException('You can only accept invites sent to you');
    }

    return new SuccessResponse();
  }
}
