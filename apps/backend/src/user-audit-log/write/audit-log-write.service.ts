import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Types } from 'mongoose';
import { AuditLogEntity } from '../core/entities/audit-log.entity';
import { AuditLogNormalized } from '../core/entities/audit-log.interface';
import { AuditLogSerializer } from '../core/entities/audit-log.serializer';

@Injectable()
export class AuditLog {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async create(dto: CreateAuditLogDto): Promise<AuditLogNormalized> {
    const auditLog = AuditLogEntity.fromNormalized({
      id: new Types.ObjectId().toString(),
      createdAt: new Date(),
      userId: dto.userId,
      actor: dto.actor,
      action: dto.action,
      relatedDomain: dto.relatedDomain,
      description: dto.description,
      relatedEntityId: dto.relatedEntityId,
    });

    await this.clickhouse.insert({
      table: 'audit_logs',
      values: [auditLog],
      format: 'JSONEachRow',
    });

    return AuditLogSerializer.normalize(auditLog);
  }

  public async createMany(dtos: CreateAuditLogDto[]): Promise<AuditLogNormalized[]> {
    if (dtos.length === 0) return [];

    const auditLogs = dtos.map((dto) =>
      AuditLogEntity.fromNormalized({
        id: new Types.ObjectId().toString(),
        createdAt: new Date(),
        userId: dto.userId,
        actor: dto.actor,
        action: dto.action,
        relatedDomain: dto.relatedDomain,
        description: dto.description,
        relatedEntityId: dto.relatedEntityId,
      }),
    );

    await this.clickhouse.insert({
      table: 'audit_logs',
      values: auditLogs,
      format: 'JSONEachRow',
    });

    return AuditLogSerializer.normalizeMany(auditLogs);
  }
}
