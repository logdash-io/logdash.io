import queryString from 'query-string';
import type { Log } from '../domain/log.js';
import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { LogsQueryFilters } from '../domain/logs-query-filters.js';
import { logger } from '$lib/domains/shared/logger/index.js';

export class LogsService {
  static async getProjectLogs(
    project_id: string,
    filters: Partial<LogsQueryFilters>,
  ): Promise<Log[]> {
    logger.debug('getting project logs', filters);
    const qs = queryString.stringify({
      ...(filters.lastId && { lastId: filters.lastId }),
      ...(filters.direction && { direction: filters.direction }),
      limit: filters.limit ?? 50,
      ...(filters.searchString && { searchString: filters.searchString }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.level && { level: filters.level }),
    });

    return httpClient.get<Log[]>(`/projects/${project_id}/logs/v2?${qs}`);
  }

  static async sendTestLog(project_id: string): Promise<void> {
    return httpClient.post(`/projects/${project_id}/test-log`);
  }
}
