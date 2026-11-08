import { httpClient } from '$lib/domains/shared/http/http-client';
import type {
  WebAnalyticsBreakdownName,
  WebAnalyticsBreakdownRow,
  WebAnalyticsDay,
  WebAnalyticsDayParams,
  WebAnalyticsDays,
  WebAnalyticsDayVisits,
  WebAnalyticsEvent,
  WebAnalyticsGoals,
  WebAnalyticsInsight,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightResult,
  WebAnalyticsJourney,
  WebAnalyticsOverview,
  WebAnalyticsRange,
  WebAnalyticsReport,
  WebAnalyticsRetention,
  WebAnalyticsSchema,
  WebAnalyticsSite,
  WebAnalyticsStatus,
  WebAnalyticsVisitor,
  WebAnalyticsVisitorEvent,
  WebAnalyticsVisitShow,
} from '../domain/web-analytics';

export class WebAnalyticsService {
  public static async readSite(
    clusterId: string,
  ): Promise<WebAnalyticsSite | null> {
    const response = await httpClient.get<{ site: WebAnalyticsSite | null }>(
      `/clusters/${clusterId}/web_analytics/site`,
    );
    return response.site;
  }

  public static async configure(
    clusterId: string,
    origins: string[],
  ): Promise<WebAnalyticsSite> {
    return httpClient.put<WebAnalyticsSite>(
      `/clusters/${clusterId}/web_analytics/site`,
      { origins },
    );
  }

  public static async readStatus(
    clusterId: string,
  ): Promise<WebAnalyticsStatus> {
    return httpClient.get<WebAnalyticsStatus>(
      `/clusters/${clusterId}/web_analytics/status`,
    );
  }

  public static async readGoals(
    clusterId: string,
    tz: string,
  ): Promise<WebAnalyticsGoals> {
    return httpClient.get<WebAnalyticsGoals>(
      `/clusters/${clusterId}/web_analytics/goals?${new URLSearchParams({ tz })}`,
    );
  }

  public static async saveGoals(
    clusterId: string,
    goals: string[],
  ): Promise<WebAnalyticsSite> {
    return httpClient.put<WebAnalyticsSite>(
      `/clusters/${clusterId}/web_analytics/goals`,
      { goals },
    );
  }

  public static async readDays(
    clusterId: string,
    date: string,
    params: WebAnalyticsDayParams,
  ): Promise<WebAnalyticsDays> {
    return httpClient.get<WebAnalyticsDays>(
      `/clusters/${clusterId}/web_analytics/days?${dayQuery(params, { date })}`,
    );
  }

  public static async readDay(
    clusterId: string,
    date: string,
    params: WebAnalyticsDayParams,
  ): Promise<WebAnalyticsDay> {
    return httpClient.get<WebAnalyticsDay>(
      `/clusters/${clusterId}/web_analytics/days/${date}?${dayQuery(params)}`,
    );
  }

  public static async readDayVisits(
    clusterId: string,
    date: string,
    params: WebAnalyticsDayParams,
    show: WebAnalyticsVisitShow,
    offset: number,
  ): Promise<WebAnalyticsDayVisits> {
    return httpClient.get<WebAnalyticsDayVisits>(
      `/clusters/${clusterId}/web_analytics/days/${date}/visits?${dayQuery(params, { show, offset: String(offset) })}`,
    );
  }

  public static async readReport(
    clusterId: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsReport> {
    return httpClient.get<WebAnalyticsReport>(
      `/clusters/${clusterId}/web_analytics?${query(range)}`,
    );
  }

  public static async readOverview(
    clusterId: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsOverview> {
    return httpClient.get<WebAnalyticsOverview>(
      `/clusters/${clusterId}/web_analytics/overview?${query(range)}`,
    );
  }

  public static async readBreakdown(
    clusterId: string,
    range: WebAnalyticsRange,
    dimension: WebAnalyticsBreakdownName,
  ): Promise<WebAnalyticsBreakdownRow[]> {
    const response = await httpClient.get<{
      rows: WebAnalyticsBreakdownRow[];
    }>(
      `/clusters/${clusterId}/web_analytics/breakdown?${query(range, { dimension })}`,
    );
    return response.rows;
  }

  public static async readEvent(
    clusterId: string,
    name: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsEvent> {
    return httpClient.get<WebAnalyticsEvent>(
      `/clusters/${clusterId}/web_analytics/events/${encodeURIComponent(name)}?${query(range)}`,
    );
  }

  public static async readEventProperty(
    clusterId: string,
    name: string,
    key: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsBreakdownRow[]> {
    const response = await httpClient.get<{
      rows: WebAnalyticsBreakdownRow[];
    }>(
      `/clusters/${clusterId}/web_analytics/events/${encodeURIComponent(name)}/properties/${encodeURIComponent(key)}?${query(range)}`,
    );
    return response.rows;
  }

  public static async readVisitor(
    clusterId: string,
    visitorId: string,
    tz: string,
  ): Promise<{
    visitor: WebAnalyticsVisitor | null;
    events: WebAnalyticsVisitorEvent[];
  }> {
    return httpClient.get(
      `/clusters/${clusterId}/web_analytics/visitors/${visitorId}?${new URLSearchParams({ tz })}`,
    );
  }

  public static async readJourneys(
    clusterId: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsJourney[]> {
    const response = await httpClient.get<{
      journeys: WebAnalyticsJourney[];
    }>(`/clusters/${clusterId}/web_analytics/journeys?${query(range)}`);
    return response.journeys;
  }

  public static async readRetention(
    clusterId: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsRetention> {
    return httpClient.get<WebAnalyticsRetention>(
      `/clusters/${clusterId}/web_analytics/retention?${query(range)}`,
    );
  }

  public static async readSchema(
    clusterId: string,
    days: number,
  ): Promise<WebAnalyticsSchema> {
    return httpClient.get<WebAnalyticsSchema>(
      `/clusters/${clusterId}/web_analytics/schema?${new URLSearchParams({ days: String(days) })}`,
    );
  }

  public static async readInsights(
    clusterId: string,
  ): Promise<WebAnalyticsInsight[]> {
    const response = await httpClient.get<{ insights: WebAnalyticsInsight[] }>(
      `/clusters/${clusterId}/web_analytics/insights`,
    );
    return response.insights;
  }

  public static async runInsight(
    clusterId: string,
    config: WebAnalyticsInsightConfig,
    tz: string,
  ): Promise<WebAnalyticsInsightResult> {
    return httpClient.post<WebAnalyticsInsightResult>(
      `/clusters/${clusterId}/web_analytics/insights/run?${new URLSearchParams({ tz })}`,
      config,
    );
  }

  public static async createInsight(
    clusterId: string,
    config: WebAnalyticsInsightConfig,
  ): Promise<WebAnalyticsInsight> {
    return httpClient.post<WebAnalyticsInsight>(
      `/clusters/${clusterId}/web_analytics/insights`,
      config,
    );
  }

  public static async updateInsight(
    clusterId: string,
    id: string,
    config: WebAnalyticsInsightConfig,
  ): Promise<WebAnalyticsInsight> {
    return httpClient.put<WebAnalyticsInsight>(
      `/clusters/${clusterId}/web_analytics/insights/${id}`,
      config,
    );
  }

  public static async reorderInsights(
    clusterId: string,
    ids: string[],
  ): Promise<WebAnalyticsInsight[]> {
    const response = await httpClient.post<{ insights: WebAnalyticsInsight[] }>(
      `/clusters/${clusterId}/web_analytics/insights/reorder`,
      { ids },
    );
    return response.insights;
  }

  public static async deleteInsight(
    clusterId: string,
    id: string,
  ): Promise<void> {
    await httpClient.delete<void>(
      `/clusters/${clusterId}/web_analytics/insights/${id}`,
    );
  }
}

function dayQuery(
  params: WebAnalyticsDayParams,
  extra: Record<string, string> = {},
): URLSearchParams {
  const search = new URLSearchParams({ tz: params.tz, ...extra });
  for (const goal of params.goals) search.append('goal', goal);
  for (const filter of params.filters)
    search.append('filter', `${filter.dimension}:${filter.value}`);
  return search;
}

function query(
  range: WebAnalyticsRange,
  extra: Record<string, string> = {},
): URLSearchParams {
  const params = new URLSearchParams({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    granularity: range.granularity,
    tz: range.tz,
    ...extra,
  });
  if (range.compare) params.set('compare', 'true');
  for (const filter of range.filters)
    params.append('filter', `${filter.dimension}:${filter.value}`);
  return params;
}
