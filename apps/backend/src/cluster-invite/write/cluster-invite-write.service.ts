import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClusterInviteEntity } from '../core/entities/cluster-invite.entity';
import { CreateClusterInviteDto } from './dto/create-invite.dto';
import { ClusterInviteNormalized } from '../core/entities/cluster-invite.interface';
import { ClusterInviteSerializer } from '../core/entities/cluster-invite.serializer';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
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
      invitedUserId: dto.invitedUserId,
      clusterId: dto.clusterId,
    });

    this.auditLog.create({
      userId: dto.inviterUserId,
      action: AuditLogEntityAction.Create,
      actor: Actor.User,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: invite._id.toString(),
      description: `Invited user ${dto.invitedUserId} to cluster ${dto.clusterId}`,
    });

    return ClusterInviteSerializer.normalize(invite);
  }

  public async delete(inviteId: string, actorUserId?: string): Promise<void> {
    await this.auditLog.create({
      userId: actorUserId,
      actor: actorUserId ? Actor.User : Actor.System,
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: inviteId,
      description: 'Cluster invite deleted',
    });

    await this.model.deleteOne({ _id: new Types.ObjectId(inviteId) });
  }
}
