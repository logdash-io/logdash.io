import {
  MetricGranularity,
  type Metric,
} from '$lib/domains/app/projects/domain/metric.js';
import { httpClient } from '$lib/domains/shared/http/http-client.js';

export class MetricHistoryService {
  static async readRecentMinutes(
    projectId: string,
    metricId: string,
    limit: number,
  ): Promise<number[]> {
    const entries = await httpClient.get<Metric[]>(
      `/projects/${projectId}/metrics/${metricId}`,
      { params: { granularity: MetricGranularity.MINUTE, limit } },
    );

    return entries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => entry.value);
  }
}
