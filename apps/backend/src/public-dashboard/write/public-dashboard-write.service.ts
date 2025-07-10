import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import {
  PublicDashboardDocument,
  PublicDashboardEntity,
} from '../core/entities/public-dashboard.entity';
import { CreatePublicDashboardDto } from './dto/create-public-dashboard.dto';
import { PublicDashboardSerializer } from '../core/entities/public-dashboard.serializer';
import { PublicDashboardNormalized } from '../core/entities/public-dashboard.interface';
import { AddMonitorToDashboardDto } from './dto/add-monitor-to-dashboard.dto';
import { RemoveMonitorFromDashboardDto } from './dto/remove-monitor-from-dashboard.dto';
import { UpdatePublicDashboardDto } from './dto/update-public-dashboard.dto';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';

@Injectable()
export class PublicDashboardWriteService {
  constructor(
    @InjectModel(PublicDashboardEntity.name)
    private readonly publicDashboardModel: Model<PublicDashboardDocument>,
    private readonly auditLog: AuditLog,
  ) {}

  public async create(dto: CreatePublicDashboardDto): Promise<PublicDashboardNormalized> {
    const entity = new this.publicDashboardModel({
      clusterId: dto.clusterId,
      httpMonitorsIds: dto.httpMonitorsIds || [],
      name: dto.name,
      isPublic: dto.isPublic,
    });

    await this.auditLog.create({
      action: AuditLogEntityAction.Create,
      relatedDomain: RelatedDomain.PublicDashboard,
      relatedEntityId: entity.id,
    });

    const saved = await entity.save();
    return PublicDashboardSerializer.normalize(saved);
  }

  public async update(dto: UpdatePublicDashboardDto): Promise<PublicDashboardNormalized> {
    const updateQuery: UpdateQuery<PublicDashboardEntity> = {};

    if (dto.name) {
      updateQuery.name = dto.name;
    }
    if (dto.isPublic) {
      updateQuery.isPublic = dto.isPublic;
    }

    const entity = await this.publicDashboardModel.findByIdAndUpdate(dto.id, dto, { new: true });

    return PublicDashboardSerializer.normalize(entity);
  }

  public async addMonitorToDashboard(dto: AddMonitorToDashboardDto): Promise<void> {
    await this.publicDashboardModel.updateOne(
      { _id: dto.publicDashboardId },
      { $addToSet: { httpMonitorsIds: dto.httpMonitorId } },
    );
  }

  public async removeMonitorFromDashboard(dto: RemoveMonitorFromDashboardDto): Promise<void> {
    await this.publicDashboardModel.updateOne(
      { _id: dto.publicDashboardId },
      { $pull: { httpMonitorsIds: dto.httpMonitorId } },
    );
  }

  public async deleteOnlyEntity(id: string): Promise<void> {
    await this.publicDashboardModel.findByIdAndDelete(id);
  }

  public async deleteByClusterId(clusterId: string): Promise<void> {
    await this.publicDashboardModel.deleteMany({ clusterId });
  }
}
