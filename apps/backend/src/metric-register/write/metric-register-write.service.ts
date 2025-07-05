import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MetricRegisterEntryEntity } from '../core/entities/metric-register-entry.entity';
import { CreateMetricRegisterEntryDto } from './dto/create-metric-register-entry.dto';
import { RemoveMetricRegisterEntryDto } from './dto/remove-metric-register-entry.dto';
import { UpdateCounterAbsoluteValueDto } from './dto/update-counter-absolute-value.dto';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { MetricOperation } from '@logdash/js-sdk';

@Injectable()
export class MetricRegisterWriteService {
  constructor(
    @InjectModel(MetricRegisterEntryEntity.name)
    private readonly model: Model<MetricRegisterEntryEntity>,
    private readonly auditLog: AuditLog,
  ) {}

  public async createMany(
    dtos: CreateMetricRegisterEntryDto[],
    actorUserId?: string,
  ): Promise<void> {
    const entries = await this.model.insertMany(dtos, { ordered: false });

    entries.forEach((entry) => {
      this.auditLog.create({
        userId: actorUserId,
        action: AuditLogEntityAction.Create,
        actor: actorUserId ? Actor.User : Actor.System,
        relatedDomain: RelatedDomain.Metric,
        relatedEntityId: entry._id.toString(),
      });
    });
  }

  public async deleteBelongingToProject(projectId: string, actorUserId?: string): Promise<void> {
    const entries = await this.model.find({ projectId });

    await Promise.all(
      entries.map((entry) =>
        this.auditLog.create({
          userId: actorUserId,
          action: AuditLogEntityAction.Delete,
          actor: actorUserId ? Actor.User : Actor.System,
          relatedDomain: RelatedDomain.Metric,
          relatedEntityId: entry._id.toString(),
          description: `Deleted due to project deletion`,
        }),
      ),
    );

    await this.model.deleteMany({ projectId }, { ordered: false });
  }

  public async removeById(
    dto: RemoveMetricRegisterEntryDto,
    actorUserId?: string,
  ): Promise<string | null> {
    const entry = await this.model.findOne({
      _id: new Types.ObjectId(dto.id),
    });

    if (!entry) {
      return null;
    }

    const entryId = entry._id.toString();

    await this.auditLog.create({
      userId: actorUserId,
      action: AuditLogEntityAction.Delete,
      actor: actorUserId ? Actor.User : Actor.System,
      relatedDomain: RelatedDomain.Metric,
      relatedEntityId: entryId,
    });

    await this.model.deleteOne({ _id: entry._id });

    return entryId;
  }

  public async upsertAbsoluteValues(
    dtos: { metricRegisterEntryId: string; value: number }[],
  ): Promise<void> {
    console.log('upsertAbsoluteValues', dtos);

    await this.model.bulkWrite(
      dtos.map((dto) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(dto.metricRegisterEntryId) },
          update: { $set: { 'values.counter.absoluteValue': dto.value } },
        },
      })),
      { ordered: false },
    );
  }
}
