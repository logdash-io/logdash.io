import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { UserAuditLogNormalized } from './user-audit-log.interface';

export class UserAuditLogEntity {
  id: string;

  user_id: string;

  actor: string;

  related_domain: string;

  description: string;

  created_at: string;

  public static fromNormalized(normalized: UserAuditLogNormalized): UserAuditLogEntity {
    return {
      id: normalized.id,
      user_id: normalized.userId,
      actor: normalized.actor,
      related_domain: normalized.relatedDomain,
      description: normalized.description,
      created_at: ClickhouseUtils.jsDateToClickhouseDate(normalized.createdAt),
    };
  }
}
