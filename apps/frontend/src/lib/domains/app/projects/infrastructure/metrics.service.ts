import {
  MetricGranularity,
  type Metric,
  type SimplifiedMetric,
} from '$lib/domains/app/projects/domain/metric.js';
import { httpClient } from '$lib/domains/shared/http/http-client.js';

export class MetricsService {
  static async readCurrent(clusterId: string): Promise<SimplifiedMetric[]> {
    return httpClient.get<SimplifiedMetric[]>(`/clusters/${clusterId}/metrics`);
  }

  static async readHistory(
    clusterId: string,
    metricId: string,
  ): Promise<Metric[]> {
    return httpClient.get<Metric[]>(
      `/clusters/${clusterId}/metrics/${metricId}`,
    );
  }

  static async readRecentMinutes(
    clusterId: string,
    metricId: string,
    limit: number,
  ): Promise<number[]> {
    const entries = await httpClient.get<Metric[]>(
      `/clusters/${clusterId}/metrics/${metricId}`,
      { params: { granularity: MetricGranularity.MINUTE, limit } },
    );

    return entries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => entry.value);
  }

  static async delete(projectId: string, metricId: string): Promise<void> {
    await httpClient.delete<void>(
      `/projects/${projectId}/metric-register/${metricId}`,
    );
  }
}
