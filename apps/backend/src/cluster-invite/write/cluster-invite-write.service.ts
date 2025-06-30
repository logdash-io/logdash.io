import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClusterInviteEntity } from '../core/entities/cluster-invite.entity';
import { CreateClusterInviteDto } from './dto/create-invite.dto';
import { ClusterInviteNormalized } from '../core/entities/cluster-invite.interface';
import { ClusterInviteSerializer } from '../core/entities/cluster-invite.serializer';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import {
  AuditLogClusterAction,
  AuditLogEntityAction,
  AuditLogUserAction,
} from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';

@Injectable()
export class ClusterInviteWriteService {
  constructor(
    @InjectModel(ClusterInviteEntity.name)
    private model: Model<ClusterInviteEntity>,
    private readonly auditLog: AuditLog,
  ) {}

  public async create(dto: CreateClusterInviteDto): Promise<ClusterInviteNormalized> {
    const invite = await this.model.create({
      inviterUserId: dto.inviterUserId,
      invitedUserEmail: dto.invitedUserEmail,
      clusterId: dto.clusterId,
      role: dto.role,
    });

    this.auditLog.create({
      userId: dto.inviterUserId,
      action: AuditLogClusterAction.InvitedUser,
      actor: Actor.User,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: invite._id.toString(),
      description: `Invited user ${dto.invitedUserEmail} to cluster ${dto.clusterId} with role ${dto.role}`,
    });

    return ClusterInviteSerializer.normalize(invite);
  }

  public async delete(inviteId: string, actorUserId?: string): Promise<void> {
    await this.auditLog.create({
      userId: actorUserId,
      actor: actorUserId ? Actor.User : Actor.System,
      action: AuditLogClusterAction.DeletedInvite,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: inviteId,
      description: `Cluster invite ${inviteId} deleted`,
    });

    await this.model.deleteOne({ _id: new Types.ObjectId(inviteId) });
  }
}
