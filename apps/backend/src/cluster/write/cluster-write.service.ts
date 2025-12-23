import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { ClusterEntity } from '../core/entities/cluster.entity';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { ClusterNormalized } from '../core/entities/cluster.interface';
import { ClusterSerializer } from '../core/entities/cluster.serializer';
import { UpdateClusterDto } from './dto/update-cluster.dto';
import { ClusterTier } from '../core/enums/cluster-tier.enum';
import { Metrics } from '@logdash/js-sdk';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import {
  AuditLogClusterAction,
  AuditLogEntityAction,
  AuditLogUserAction,
} from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { ClusterRole } from '../core/enums/cluster-role.enum';
@Injectable()
export class ClusterWriteService {
  constructor(
    @InjectModel(ClusterEntity.name)
    private model: Model<ClusterEntity>,
    private readonly metrics: Metrics,
    private readonly auditLog: AuditLog,
  ) {}

  public async create(dto: CreateClusterDto): Promise<ClusterNormalized> {
    const cluster = await this.model.create({
      name: dto.name,
      creatorId: dto.creatorId,
      tier: dto.tier,
      roles: dto.roles,
      color: dto.color,
    });

    this.metrics.mutate('clustersCreated', 1);

    this.auditLog.create({
      userId: dto.creatorId,
      action: AuditLogEntityAction.Create,
      actor: Actor.User,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: cluster._id.toString(),
    });

    return ClusterSerializer.normalize(cluster);
  }

  public async update(dto: UpdateClusterDto, actorUserId?: string): Promise<void> {
    const updateQuery = this.constructUpdateQuery(dto);

    this.auditLog.create({
      userId: actorUserId,
      action: AuditLogEntityAction.Update,
      actor: actorUserId ? Actor.User : Actor.System,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: dto.id,
    });

    await this.model.updateOne({ _id: new Types.ObjectId(dto.id) }, updateQuery);
  }

  private constructUpdateQuery(dto: UpdateClusterDto): UpdateQuery<ClusterEntity> {
    const updateQuery: UpdateQuery<ClusterEntity> = {};

    if (dto.name) {
      updateQuery.name = dto.name;
    }

    if (dto.roles) {
      updateQuery.roles = dto.roles;
    }

    if (dto.creatorId) {
      updateQuery.creatorId = dto.creatorId;
    }

    return updateQuery;
  }

  public async updateTiersByCreatorId(creatorId: string, tier: ClusterTier): Promise<void> {
    const clusters = await this.model.find({ creatorId });

    clusters.forEach((cluster) => {
      this.auditLog.create({
        userId: creatorId,
        actor: Actor.System,
        action: AuditLogEntityAction.Update,
        relatedDomain: RelatedDomain.Cluster,
        relatedEntityId: cluster._id.toString(),
        description: `Updated tier to ${tier} because user tier changed`,
      });
    });

    await this.model.updateMany({ creatorId: new Types.ObjectId(creatorId) }, { tier });
  }

  public async delete(id: string, actorUserId?: string): Promise<void> {
    await this.auditLog.create({
      userId: actorUserId,
      actor: actorUserId ? Actor.User : Actor.System,
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: id,
    });

    await this.model.deleteOne({ _id: new Types.ObjectId(id) });
  }

  public async deleteRole(clusterId: string, userId: string, actorUserId?: string): Promise<void> {
    this.auditLog.create({
      userId: actorUserId,
      actor: actorUserId ? Actor.User : Actor.System,
      action: AuditLogClusterAction.RevokedRole,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: clusterId,
      description: `Revoked role from user ${userId}`,
    });

    this.auditLog.create({
      userId: userId,
      actor: Actor.User,
      action: AuditLogUserAction.RevokedRoleFromCluster,
      relatedDomain: RelatedDomain.User,
      relatedEntityId: clusterId,
      description: `This user role has been revoked from cluster ${clusterId}`,
    });

    await this.model.updateOne(
      { _id: new Types.ObjectId(clusterId) },
      { $unset: { [`roles.${userId}`]: 1 } },
    );
  }

  public async addRole(clusterId: string, userId: string, role: ClusterRole): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(clusterId) },
      { $set: { [`roles.${userId}`]: role } },
    );

    this.auditLog.create({
      userId: userId,
      actor: Actor.User,
      action: AuditLogUserAction.AcceptedInviteToCluster,
      relatedDomain: RelatedDomain.User,
      relatedEntityId: clusterId,
      description: `Accepted invite to cluster ${clusterId} with role ${role}`,
    });

    this.auditLog.create({
      userId: userId,
      actor: Actor.System,
      action: AuditLogClusterAction.AcceptedInvite,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: clusterId,
      description: `Accepted invite for user ${userId} to cluster ${clusterId} with role ${role}`,
    });
  }
}
