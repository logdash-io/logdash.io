import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClusterEntity } from '../core/entities/cluster.entity';
import { ClusterNormalized } from '../core/entities/cluster.interface';
import { ClusterSerializer } from '../core/entities/cluster.serializer';

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

  public async readWhereUserIsInMembers(userId: string): Promise<ClusterNormalized[]> {
    const clusters = await this.model.find({ members: userId }).lean<ClusterEntity[]>().exec();

    return ClusterSerializer.normalizeMany(clusters);
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
    const cluster = await this.model
      .findOne({ _id: dto.clusterId, members: dto.userId })
      .lean<ClusterEntity>()
      .exec();

    return !!cluster;
  }

  public async readByCreatorId(creatorId: string): Promise<ClusterNormalized[]> {
    const clusters = await this.model.find({ creatorId }).lean<ClusterEntity[]>().exec();

    return ClusterSerializer.normalizeMany(clusters);
  }

  public async countByCreatorId(creatorId: string): Promise<number> {
    return await this.model.countDocuments({ creatorId }).exec();
  }
}
