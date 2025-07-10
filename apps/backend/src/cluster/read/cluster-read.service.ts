import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClusterEntity } from '../core/entities/cluster.entity';
import { ClusterNormalized } from '../core/entities/cluster.interface';
import { ClusterSerializer } from '../core/entities/cluster.serializer';
import { ClusterRole } from '../core/enums/cluster-role.enum';

@Injectable()
export class ClusterReadService {
  constructor(
    @InjectModel(ClusterEntity.name)
    private model: Model<ClusterEntity>,
  ) {}

  public async readById(clusterId: string): Promise<ClusterNormalized | null> {
    const cluster = await this.model.findById(clusterId).lean<ClusterEntity>().exec();

    return cluster ? ClusterSerializer.normalize(cluster) : null;
  }

  public async readByIdOrThrow(clusterId: string): Promise<ClusterNormalized> {
    const cluster = await this.readById(clusterId);
    if (!cluster) {
      throw new NotFoundException('Cluster not found');
    }
    return cluster;
  }

  public async readWhereUserHasAnyRole(userId: string): Promise<ClusterNormalized[]> {
    const clusters = await this.model
      .find({
        [`roles.${userId}`]: {
          $exists: true,
          $ne: null,
        },
      })
      .lean<ClusterEntity[]>()
      .exec();
    return ClusterSerializer.normalizeMany(clusters);
  }

  public async userIsMember(dto: { userId: string; clusterId: string }): Promise<boolean> {
    const cluster = await this.model.findOne({ _id: dto.clusterId }).lean<ClusterEntity>().exec();

    if (cluster) {
      return !!cluster.roles[dto.userId];
    }

    return false;
  }

  public async readByCreatorId(creatorId: string): Promise<ClusterNormalized[]> {
    const clusters = await this.model.find({ creatorId }).lean<ClusterEntity[]>().exec();

    return ClusterSerializer.normalizeMany(clusters);
  }

  public async countByCreatorId(creatorId: string): Promise<number> {
    return await this.model.countDocuments({ creatorId }).exec();
  }

  public async readMembers(clusterId: string): Promise<{ id: string; role: ClusterRole }[]> {
    const cluster = await this.model.findById(clusterId).lean<ClusterEntity>().exec();

    // map roles (email:role) to members
    const roles = cluster?.roles;

    if (!roles) {
      return [];
    }

    return Object.entries(roles).map(([id, role]) => ({
      id,
      role,
    }));
  }

  public async countBeingMemberOfClusters(userId: string): Promise<number> {
    return await this.model
      .countDocuments({
        [`roles.${userId}`]: {
          $exists: true,
          $ne: null,
        },
      })
      .exec();
  }
}
