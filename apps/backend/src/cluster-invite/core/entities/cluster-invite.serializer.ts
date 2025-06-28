import { ClusterInviteEntity } from './cluster-invite.entity';
import { ClusterInviteNormalized, ClusterInviteSerialized } from './cluster-invite.interface';

export class ClusterInviteSerializer {
  public static normalize(entity: ClusterInviteEntity): ClusterInviteNormalized {
    return {
      id: entity._id.toString(),
      inviterUserId: entity.inviterUserId,
      invitedUserId: entity.invitedUserId,
      clusterId: entity.clusterId,
      role: entity.role,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static normalizeMany(entities: ClusterInviteEntity[]): ClusterInviteNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(entity: ClusterInviteNormalized): ClusterInviteSerialized {
    return {
      id: entity.id,
      inviterUserId: entity.inviterUserId,
      invitedUserId: entity.invitedUserId,
      clusterId: entity.clusterId,
      role: entity.role,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  public static serializeMany(entities: ClusterInviteNormalized[]): ClusterInviteSerialized[] {
    return entities.map((entity) => this.serialize(entity));
  }
}
