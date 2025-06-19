import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { UserAuditLogEntity } from './user-audit-log.entity';
import { UserAuditLogNormalized, UserAuditLogSerialized } from './user-audit-log.interface';

export class UserAuditLogSerializer {
  public static normalize(entity: UserAuditLogEntity): UserAuditLogNormalized {
    return {
      id: entity.id,
      userId: entity.user_id,
      actor: entity.actor,
      relatedDomain: entity.related_domain,
      description: entity.description,
      createdAt: ClickhouseUtils.clickhouseDateToJsDate(entity.created_at),
    };
  }

  public static normalizeMany(entities: UserAuditLogEntity[]): UserAuditLogNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(normalized: UserAuditLogNormalized): UserAuditLogSerialized {
    return {
      id: normalized.id,
      userId: normalized.userId,
      actor: normalized.actor,
      relatedDomain: normalized.relatedDomain,
      description: normalized.description,
      createdAt: normalized.createdAt,
    };
  }

  public static serializeMany(normalized: UserAuditLogNormalized[]): UserAuditLogSerialized[] {
    return normalized.map((entity) => this.serialize(entity));
  }
}
