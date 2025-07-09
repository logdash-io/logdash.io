import { CustomDomainNormalized, CustomDomainSerialized } from './custom-domain.interface';

export class CustomDomainSerializer {
  public static normalize(entity: any): CustomDomainNormalized {
    return {
      id: entity._id.toString(),
      domain: entity.domain,
      publicDashboardId: entity.publicDashboardId,
      attemptCount: entity.attemptCount,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static serialize(normalized: CustomDomainNormalized): CustomDomainSerialized {
    return {
      id: normalized.id,
      domain: normalized.domain,
      publicDashboardId: normalized.publicDashboardId,
      attemptCount: normalized.attemptCount,
      status: normalized.status,
      createdAt: normalized.createdAt.toISOString(),
      updatedAt: normalized.updatedAt.toISOString(),
    };
  }

  public static serializeMany(normalized: CustomDomainNormalized[]): CustomDomainSerialized[] {
    return normalized.map((item) => this.serialize(item));
  }
}
