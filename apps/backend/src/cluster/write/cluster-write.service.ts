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
@Injectable()
export class ClusterWriteService {
  constructor(
    @InjectModel(ClusterEntity.name)
    private model: Model<ClusterEntity>,
    private readonly metrics: Metrics,
  ) {}

  public async create(dto: CreateClusterDto): Promise<ClusterNormalized> {
    const cluster = await this.model.create({
      name: dto.name,
      members: [...new Set([dto.creatorId, ...(dto.members || [])])],
      creatorId: dto.creatorId,
      tier: dto.tier,
    });

    this.metrics.mutate('clustersCreated', 1);

    return ClusterSerializer.normalize(cluster);
  }

  public async update(dto: UpdateClusterDto): Promise<void> {
    const updateQuery = this.constructUpdateQuery(dto);

    await this.model.updateOne(
      { _id: new Types.ObjectId(dto.id) },
      updateQuery,
    );
  }

  private constructUpdateQuery(
    dto: UpdateClusterDto,
  ): UpdateQuery<ClusterEntity> {
    const updateQuery: UpdateQuery<ClusterEntity> = {};

    if (dto.name) {
      updateQuery.name = dto.name;
    }

    if (dto.members) {
      updateQuery.members = dto.members;
    }

    if (dto.creatorId) {
      updateQuery.creatorId = dto.creatorId;
    }

    return updateQuery;
  }

  public async updateTiersByCreatorId(
    creatorId: string,
    tier: ClusterTier,
  ): Promise<void> {
    await this.model.updateMany(
      { creatorId: new Types.ObjectId(creatorId) },
      { tier },
    );
  }

  public async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
