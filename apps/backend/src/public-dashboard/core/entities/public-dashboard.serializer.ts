import { PublicDashboardNormalized, PublicDashboardSerialized } from './public-dashboard.interface';

export class PublicDashboardSerializer {
  public static normalize(entity: any): PublicDashboardNormalized {
    return {
      id: entity._id.toString(),
      clusterId: entity.clusterId,
      httpMonitorsIds: entity.httpMonitorsIds || [],
      name: entity.name,
      isPublic: entity.isPublic,
    };
  }

  public static serialize(normalized: PublicDashboardNormalized): PublicDashboardSerialized {
    return {
      id: normalized.id,
      clusterId: normalized.clusterId,
      httpMonitorsIds: normalized.httpMonitorsIds,
      name: normalized.name,
      isPublic: normalized.isPublic,
    };
  }

  public static serializeMany(
    normalized: PublicDashboardNormalized[],
  ): PublicDashboardSerialized[] {
    return normalized.map((item) => this.serialize(item));
  }
}
