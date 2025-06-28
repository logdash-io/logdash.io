import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClusterInviteEntity } from '../core/entities/cluster-invite.entity';
import { ClusterInviteNormalized } from '../core/entities/cluster-invite.interface';
import { ClusterInviteSerializer } from '../core/entities/cluster-invite.serializer';

@Injectable()
export class ClusterInviteReadService {
  constructor(
    @InjectModel(ClusterInviteEntity.name)
    private model: Model<ClusterInviteEntity>,
  ) {}

  public async readById(inviteId: string): Promise<ClusterInviteNormalized | null> {
    const invite = await this.model.findById(inviteId).lean<ClusterInviteEntity>().exec();

    return invite ? ClusterInviteSerializer.normalize(invite) : null;
  }

  public async readByClusterId(clusterId: string): Promise<ClusterInviteNormalized[]> {
    const invites = await this.model.find({ clusterId }).lean<ClusterInviteEntity[]>().exec();

    return ClusterInviteSerializer.normalizeMany(invites);
  }

  public async readByInvitedUserId(invitedUserId: string): Promise<ClusterInviteNormalized[]> {
    const invites = await this.model.find({ invitedUserId }).lean<ClusterInviteEntity[]>().exec();

    return ClusterInviteSerializer.normalizeMany(invites);
  }

  public async findExistingInvite(dto: {
    invitedUserId: string;
    clusterId: string;
  }): Promise<ClusterInviteNormalized | null> {
    const invite = await this.model
      .findOne({ invitedUserId: dto.invitedUserId, clusterId: dto.clusterId })
      .lean<ClusterInviteEntity>()
      .exec();

    return invite ? ClusterInviteSerializer.normalize(invite) : null;
  }
}
