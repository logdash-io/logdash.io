import {
  CustomDomainNormalized,
  CustomDomainSerialized,
} from '../../../custom-domain/core/entities/custom-domain.interface';
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

  public static serialize(
    normalized: PublicDashboardNormalized,
    params?: {
      customDomain?: CustomDomainSerialized;
    },
  ): PublicDashboardSerialized {
    return {
      id: normalized.id,
      clusterId: normalized.clusterId,
      httpMonitorsIds: normalized.httpMonitorsIds,
      name: normalized.name,
      isPublic: normalized.isPublic,
      customDomain: params?.customDomain,
    };
  }

  public static serializeMany(
    normalized: PublicDashboardNormalized[],
    params?: {
      customDomains?: CustomDomainSerialized[];
    },
  ): PublicDashboardSerialized[] {
    return normalized.map((item) =>
      this.serialize(item, {
        customDomain: params?.customDomains?.find(
          (customDomain) => customDomain.publicDashboardId === item.id,
        ),
      }),
    );
  }
}
