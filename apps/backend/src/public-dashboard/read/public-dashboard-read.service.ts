import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PublicDashboardDocument,
  PublicDashboardEntity,
} from '../core/entities/public-dashboard.entity';
import { PublicDashboardSerializer } from '../core/entities/public-dashboard.serializer';
import { PublicDashboardNormalized } from '../core/entities/public-dashboard.interface';

@Injectable()
export class PublicDashboardReadService {
  constructor(
    @InjectModel(PublicDashboardEntity.name)
    private readonly publicDashboardModel: Model<PublicDashboardDocument>,
  ) {}

  public async readByClusterId(clusterId: string): Promise<PublicDashboardNormalized[]> {
    console.log(clusterId);

    const entities = await this.publicDashboardModel.find({ clusterId }).exec();
    return entities.map((entity) => PublicDashboardSerializer.normalize(entity));
  }

  public async readById(id: string): Promise<PublicDashboardNormalized | null> {
    const entity = await this.publicDashboardModel.findById(id).exec();
    if (!entity) {
      return null;
    }
    return PublicDashboardSerializer.normalize(entity);
  }
}
