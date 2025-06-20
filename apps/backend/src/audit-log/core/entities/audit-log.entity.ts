import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { AuditLogNormalized } from './audit-log.interface';

export class AuditLogEntity {
  id: string;

  created_at: string;

  user_id: string | null;

  actor: string | null;

  action: string | null;

  related_domain: string | null;

  description: string | null;

  related_entity_id: string | null;

  public static fromNormalized(normalized: AuditLogNormalized): AuditLogEntity {
    return {
      id: normalized.id,
      created_at: ClickhouseUtils.jsDateToClickhouseDate(normalized.createdAt),
      user_id: normalized.userId || null,
      actor: normalized.actor || null,
      action: normalized.action || null,
      related_domain: normalized.relatedDomain || null,
      description: normalized.description || null,
      related_entity_id: normalized.relatedEntityId || null,
    };
  }
}
