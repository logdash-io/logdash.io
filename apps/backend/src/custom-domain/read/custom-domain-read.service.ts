import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomDomainDocument, CustomDomainEntity } from '../core/entities/custom-domain.entity';
import { CustomDomainSerializer } from '../core/entities/custom-domain.serializer';
import { CustomDomainNormalized } from '../core/entities/custom-domain.interface';
import { CustomDomainStatus } from '../core/enums/custom-domain-status.enum';

@Injectable()
export class CustomDomainReadService {
  constructor(
    @InjectModel(CustomDomainEntity.name)
    private readonly customDomainModel: Model<CustomDomainDocument>,
  ) {}

  public async readById(id: string): Promise<CustomDomainNormalized | null> {
    const entity = await this.customDomainModel.findById(id).exec();
    if (!entity) {
      return null;
    }
    return CustomDomainSerializer.normalize(entity);
  }

  public async readByPublicDashboardId(
    publicDashboardId: string,
  ): Promise<CustomDomainNormalized | null> {
    const entity = await this.customDomainModel.findOne({ publicDashboardId }).exec();
    if (!entity) {
      return null;
    }
    return CustomDomainSerializer.normalize(entity);
  }

  public async readByDomain(domain: string): Promise<CustomDomainNormalized | null> {
    const entity = await this.customDomainModel.findOne({ domain }).exec();
    if (!entity) {
      return null;
    }
    return CustomDomainSerializer.normalize(entity);
  }

  public async readDomainsToVerify(): Promise<CustomDomainNormalized[]> {
    const entities = await this.customDomainModel
      .find({ status: CustomDomainStatus.Verifying })
      .exec();
    return entities.map((entity) => CustomDomainSerializer.normalize(entity));
  }
}
