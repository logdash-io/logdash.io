import { ClickHouseClient } from '@clickhouse/client';
import { INestApplication } from '@nestjs/common';
import { AuditLogNormalized } from '../../src/audit-log/core/entities/audit-log.interface';
import { AuditLogEntity } from '../../src/audit-log/core/entities/audit-log.entity';
import { sleep } from './sleep';

export class AuditLogUtils {
  private clickhouseClient: ClickHouseClient;

  constructor(private readonly app: INestApplication<any>) {
    this.clickhouseClient = app.get(ClickHouseClient);
  }

  private matchAuditLog(auditLog: AuditLogEntity, dto: Partial<AuditLogNormalized>): boolean {
    if (dto.userId && auditLog.user_id !== dto.userId) {
      return false;
    }

    if (dto.actor && auditLog.actor !== dto.actor) {
      return false;
    }

    if (dto.action && auditLog.action !== dto.action) {
      return false;
    }

    if (dto.relatedDomain && auditLog.related_domain !== dto.relatedDomain) {
      return false;
    }

    if (dto.relatedEntityId && auditLog.related_entity_id !== dto.relatedEntityId) {
      return false;
    }

    if (dto.description && auditLog.description !== dto.description) {
      return false;
    }

    return true;
  }

  public async assertAuditLog(dto: Partial<AuditLogNormalized>): Promise<AuditLogEntity> {
    await sleep(200);

    const response = await this.clickhouseClient.query({
      query: `SELECT * FROM audit_logs`,
      format: 'JSONEachRow',
    });

    const auditLogs = (await response.json()) as any as AuditLogEntity[];

    if (auditLogs.length === 0) {
      throw new Error('No audit logs found');
    }

    const matchingAuditLog = auditLogs.find((auditLog) => this.matchAuditLog(auditLog, dto));

    if (!matchingAuditLog) {
      throw new Error('No matching audit log found');
    }

    return matchingAuditLog;
  }

  public async countUserAuditLogs(userId: string): Promise<number> {
    const response = await this.clickhouseClient.query({
      query: `SELECT COUNT(*) FROM audit_logs WHERE user_id = '${userId}'`,
      format: 'JSONEachRow',
    });

    const result = (await response.json()) as any;

    return Number(result[0]['COUNT()']);
  }
}
