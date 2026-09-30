import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model } from 'mongoose';
import {
  PublicDashboardDocument,
  PublicDashboardEntity,
} from '../core/entities/public-dashboard.entity';
import { PublicDashboardSerializer } from '../core/entities/public-dashboard.serializer';
import { PublicDashboardNormalized } from '../core/entities/public-dashboard.interface';
import { CustomDomainReadService } from '../../custom-domain/read/custom-domain-read.service';

@Injectable()
export class PublicDashboardReadService {
  constructor(
    @InjectModel(PublicDashboardEntity.name)
    private readonly publicDashboardModel: Model<PublicDashboardDocument>,
    private readonly customDomainReadService: CustomDomainReadService,
  ) {}

  public async readByClusterId(clusterId: string): Promise<PublicDashboardNormalized[]> {
    const entities = await this.publicDashboardModel.find({ clusterId }).exec();
    return entities.map((entity) => PublicDashboardSerializer.normalize(entity));
  }

  public async readByClustersIds(clusterIds: string[]): Promise<PublicDashboardNormalized[]> {
    const entities = await this.publicDashboardModel
      .find({ clusterId: { $in: clusterIds } })
      .exec();
    return entities.map((entity) => PublicDashboardSerializer.normalize(entity));
  }

  public async readById(id: string): Promise<PublicDashboardNormalized | null> {
    const entity = await this.publicDashboardModel.findById(id).exec();
    if (!entity) {
      return null;
    }
    return PublicDashboardSerializer.normalize(entity);
  }

  public async readByIdOrDomain(idOrDomain: string): Promise<PublicDashboardNormalized | null> {
    const id = isObjectIdOrHexString(idOrDomain)
      ? idOrDomain
      : (await this.customDomainReadService.readVerifiedByDomain(idOrDomain))?.publicDashboardId;

    return id ? this.readById(id) : null;
  }
}
