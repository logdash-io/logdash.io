import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { AuditLogEntity } from './audit-log.entity';
import { AuditLogNormalized, AuditLogSerialized } from './audit-log.interface';

export class AuditLogSerializer {
  public static normalize(entity: AuditLogEntity): AuditLogNormalized {
    return {
      id: entity.id,
      createdAt: ClickhouseUtils.clickhouseDateToJsDate(entity.created_at),
      userId: entity.user_id || undefined,
      actor: entity.actor || undefined,
      action: entity.action || undefined,
      relatedDomain: entity.related_domain || undefined,
      description: entity.description || undefined,
      relatedEntityId: entity.related_entity_id || undefined,
    };
  }

  public static normalizeMany(entities: AuditLogEntity[]): AuditLogNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(normalized: AuditLogNormalized): AuditLogSerialized {
    return {
      id: normalized.id,
      createdAt: normalized.createdAt,
      userId: normalized.userId,
      actor: normalized.actor,
      action: normalized.action,
      relatedDomain: normalized.relatedDomain,
      description: normalized.description,
      relatedEntityId: normalized.relatedEntityId,
    };
  }

  public static serializeMany(normalized: AuditLogNormalized[]): AuditLogSerialized[] {
    return normalized.map((entity) => this.serialize(entity));
  }
}
