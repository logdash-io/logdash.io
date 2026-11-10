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
    site: Pick<WebAnalyticsSiteEntity, 'views' | 'insights' | 'viewsVersion'> | null,
  ): WebAnalyticsLayoutNormalized {
    const views = site?.views ?? [];
    return {
      viewsVersion: site?.viewsVersion ?? 0,
      views: views.map((view) => WebAnalyticsViewSerializer.normalize(view)),
      insights: (site?.insights ?? []).map((insight) =>
        WebAnalyticsInsightSerializer.normalize(insight, views),
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
  public static normalize(
    entity: WebAnalyticsInsightEntity,
    views: WebAnalyticsViewEntity[],
  ): WebAnalyticsInsightNormalized {
    const { _id, view, section, ...config } = entity;
    const own = views.find((entry) => entry._id.toString() === view);
    const sections = (own ?? views[0])?.sections ?? [];
    return {
      id: _id.toString(),
      ...config,
      ...(own ? { view } : {}),
      ...(sections.some((entry) => entry._id.toString() === section) ? { section } : {}),
    };
  }
}
