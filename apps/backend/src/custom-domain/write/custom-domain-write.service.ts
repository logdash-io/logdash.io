import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { CustomDomainDocument, CustomDomainEntity } from '../core/entities/custom-domain.entity';
import { CreateCustomDomainDto } from './dto/create-custom-domain.dto';
import { UpdateCustomDomainDto } from './dto/update-custom-domain.dto';
import { CustomDomainSerializer } from '../core/entities/custom-domain.serializer';
import { CustomDomainNormalized } from '../core/entities/custom-domain.interface';
import { CustomDomainStatus } from '../core/enums/custom-domain-status.enum';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import {
  AuditLogCustomDomainAction,
  AuditLogEntityAction,
} from '../../audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';

@Injectable()
export class CustomDomainWriteService {
  constructor(
    @InjectModel(CustomDomainEntity.name)
    private readonly customDomainModel: Model<CustomDomainDocument>,
    private readonly auditLog: AuditLog,
  ) {}

  public async create(dto: CreateCustomDomainDto): Promise<CustomDomainNormalized> {
    const entity = new this.customDomainModel({
      domain: dto.domain,
      publicDashboardId: dto.publicDashboardId,
      attemptCount: 0,
      status: CustomDomainStatus.Verifying,
    });

    const saved = await entity.save();

    await this.auditLog.create({
      action: AuditLogEntityAction.Create,
      relatedDomain: RelatedDomain.CustomDomain,
      relatedEntityId: entity.id,
    });

    return CustomDomainSerializer.normalize(saved);
  }

  public async update(dto: UpdateCustomDomainDto): Promise<CustomDomainNormalized> {
    const updateQuery: UpdateQuery<CustomDomainEntity> = {};

    if (dto.domain !== undefined) {
      updateQuery.domain = dto.domain;
    }
    if (dto.attemptCount !== undefined) {
      updateQuery.attemptCount = dto.attemptCount;
    }
    if (dto.status !== undefined) {
      updateQuery.status = dto.status;
    }

    const entity = await this.customDomainModel.findByIdAndUpdate(dto.id, updateQuery, {
      new: true,
    });

    return CustomDomainSerializer.normalize(entity);
  }

  public async delete(id: string): Promise<void> {
    await this.auditLog.create({
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.CustomDomain,
      relatedEntityId: id,
    });

    await this.customDomainModel.findByIdAndDelete(id);
  }

  public async deleteByPublicDashboardId(publicDashboardId: string): Promise<void> {
    await this.auditLog.create({
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.CustomDomain,
      relatedEntityId: publicDashboardId,
      description: 'Deleted',
    });

    await this.customDomainModel.deleteMany({ publicDashboardId });
  }

  public async incrementAttemptCount(id: string): Promise<void> {
    await this.auditLog.create({
      action: AuditLogCustomDomainAction.AttemptIncrease,
      relatedDomain: RelatedDomain.CustomDomain,
      relatedEntityId: id,
    });

    await this.customDomainModel.findByIdAndUpdate(id, { $inc: { attemptCount: 1 } });
  }
}
