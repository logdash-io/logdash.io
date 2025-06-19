import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { CreateUserAuditLogDto } from './dto/create-user-audit-log.dto';
import { Types } from 'mongoose';
import { UserAuditLogEntity } from '../core/entities/user-audit-log.entity';
import { UserAuditLogNormalized } from '../core/entities/user-audit-log.interface';
import { UserAuditLogSerializer } from '../core/entities/user-audit-log.serializer';

@Injectable()
export class UserAuditLogWriteService {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  public async create(dto: CreateUserAuditLogDto): Promise<UserAuditLogNormalized> {
    const userAuditLog = UserAuditLogEntity.fromNormalized({
      id: new Types.ObjectId().toString(),
      createdAt: new Date(),
      userId: dto.userId,
      actor: dto.actor,
      relatedDomain: dto.relatedDomain,
      description: dto.description,
    });

    await this.clickhouse.insert({
      table: 'user_audit_logs',
      values: [userAuditLog],
      format: 'JSONEachRow',
    });

    return UserAuditLogSerializer.normalize(userAuditLog);
  }

  public async createMany(dtos: CreateUserAuditLogDto[]): Promise<UserAuditLogNormalized[]> {
    if (dtos.length === 0) return [];

    const userAuditLogs = dtos.map((dto) =>
      UserAuditLogEntity.fromNormalized({
        id: new Types.ObjectId().toString(),
        createdAt: new Date(),
        userId: dto.userId,
        actor: dto.actor,
        relatedDomain: dto.relatedDomain,
        description: dto.description,
      }),
    );

    await this.clickhouse.insert({
      table: 'user_audit_logs',
      values: userAuditLogs,
      format: 'JSONEachRow',
    });

    return UserAuditLogSerializer.normalizeMany(userAuditLogs);
  }
}
