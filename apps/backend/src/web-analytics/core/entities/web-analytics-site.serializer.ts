import { WebAnalyticsSiteEntity } from './web-analytics-site.entity';
import {
  WebAnalyticsSiteNormalized,
  WebAnalyticsSiteSerialized,
} from './web-analytics-site.interface';

export class WebAnalyticsSiteSerializer {
  public static normalize(entity: WebAnalyticsSiteEntity): WebAnalyticsSiteNormalized {
    return {
      id: entity._id.toString(),
      clusterId: entity.clusterId,
      origins: entity.origins,
      goals: entity.goals ?? [],
    };
  }

  public static serialize(site: WebAnalyticsSiteNormalized): WebAnalyticsSiteSerialized {
    return { ...site };
  }
}
