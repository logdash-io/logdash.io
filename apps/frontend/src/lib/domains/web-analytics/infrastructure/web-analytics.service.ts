import { httpClient } from '$lib/domains/shared/http/http-client';
import type {
  WebAnalyticsBreakdownName,
  WebAnalyticsBreakdownRow,
  WebAnalyticsFunnelStep,
  WebAnalyticsJourney,
  WebAnalyticsOverview,
  WebAnalyticsRange,
  WebAnalyticsReport,
  WebAnalyticsRetention,
  WebAnalyticsSite,
  WebAnalyticsStatus,
  WebAnalyticsVisitor,
  WebAnalyticsVisitorEvent,
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

  public static async readVisitors(
    clusterId: string,
    range: WebAnalyticsRange,
    offset: number,
  ): Promise<{ visitors: WebAnalyticsVisitor[]; total: number }> {
    return httpClient.get(
      `/clusters/${clusterId}/web_analytics/visitors?${query(range, { offset: String(offset) })}`,
    );
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

  public static async readFunnel(
    clusterId: string,
    range: WebAnalyticsRange,
    steps: string[],
  ): Promise<WebAnalyticsFunnelStep[]> {
    const params = query(range);
    for (const step of steps) params.append('step', step);
    const response = await httpClient.get<{ steps: WebAnalyticsFunnelStep[] }>(
      `/clusters/${clusterId}/web_analytics/funnel?${params}`,
    );
    return response.steps;
  }

  public static async readRetention(
    clusterId: string,
    range: WebAnalyticsRange,
  ): Promise<WebAnalyticsRetention> {
    return httpClient.get<WebAnalyticsRetention>(
      `/clusters/${clusterId}/web_analytics/retention?${query(range)}`,
    );
  }
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
