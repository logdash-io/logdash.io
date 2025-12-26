import queryString from 'query-string';
import type { LogsAnalyticsResponse } from '../domain/logs-analytics-response.js';
import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { LogLevel } from '../domain/log-level.js';

export class LogAnalyticsService {
  static async getProjectLogsAnalytics(
    project_id: string,
    start_date: string,
    end_date: string,
    utc_offset_hours?: number,
    levels?: LogLevel[],
    namespaces?: string[],
    search_string?: string,
  ): Promise<LogsAnalyticsResponse> {
    const qs = queryString.stringify(
      {
        startDate: start_date,
        endDate: end_date,
        ...(utc_offset_hours !== undefined && {
          utcOffsetHours: utc_offset_hours.toString(),
        }),
        ...(levels && levels.length > 0 && { levels }),
        ...(namespaces && namespaces.length > 0 && { namespaces }),
        ...(search_string &&
          search_string.trim() && { searchString: search_string }),
      },
      { arrayFormat: 'none' },
    );

    return httpClient.get<LogsAnalyticsResponse>(
      `/projects/${project_id}/logs/analytics/v1?${qs}`,
    );
  }
}
