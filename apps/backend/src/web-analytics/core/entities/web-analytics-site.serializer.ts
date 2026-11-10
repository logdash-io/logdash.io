import {
  WebAnalyticsInsightEntity,
  WebAnalyticsSiteEntity,
  WebAnalyticsViewEntity,
} from './web-analytics-site.entity';
import {
  WebAnalyticsInsightNormalized,
  WebAnalyticsLayoutNormalized,
  WebAnalyticsSiteNormalized,
  WebAnalyticsSiteSerialized,
  WebAnalyticsViewNormalized,
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

  public static normalizeLayout(
    site: Pick<WebAnalyticsSiteEntity, 'views' | 'insights'> | null,
  ): WebAnalyticsLayoutNormalized {
    return {
      views: (site?.views ?? []).map((view) => WebAnalyticsViewSerializer.normalize(view)),
      insights: (site?.insights ?? []).map((insight) =>
        WebAnalyticsInsightSerializer.normalize(insight),
      ),
    };
  }
}

export class WebAnalyticsViewSerializer {
  public static normalize(entity: WebAnalyticsViewEntity): WebAnalyticsViewNormalized {
    return {
      id: entity._id.toString(),
      name: entity.name,
      traffic: entity.traffic ?? false,
      sections: entity.sections.map((section) => ({
        id: section._id.toString(),
        title: section.title,
        collapsed: section.collapsed ?? false,
      })),
    };
  }
}

export class WebAnalyticsInsightSerializer {
  public static normalize(entity: WebAnalyticsInsightEntity): WebAnalyticsInsightNormalized {
    const { _id, ...config } = entity;
    return { id: _id.toString(), ...config };
  }
}
