import queryString from 'query-string';
import type { Log } from '../domain/log';
import { httpClient } from '$lib/domains/shared/http/http-client';
import type { LogsQueryFilters } from '../domain/logs-query-filters';
import { logger } from '$lib/domains/shared/logger/index';
import type { NamespaceMetadata } from '../domain/namespace-metadata';

export class LogsService {
  static async getProjectLogs(
    project_id: string,
    filters: Partial<LogsQueryFilters>,
  ): Promise<Log[]> {
    logger.debug('getting project logs', filters);

    const levels = filters.levels?.length ? filters.levels : undefined;

    const namespaces = filters.namespaces?.length
      ? filters.namespaces
      : undefined;

    const qs = queryString.stringify(
      {
        ...(filters.lastId && { lastId: filters.lastId }),
        ...(filters.direction && { direction: filters.direction }),
        limit: filters.limit ?? 50,
        ...(filters.searchString && { searchString: filters.searchString }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(levels && { levels }),
        ...(namespaces && { namespaces }),
      },
      { arrayFormat: 'none' },
    );

    return httpClient.get<Log[]>(`/projects/${project_id}/logs/v2?${qs}`);
  }

  static async getLogsNamespaces(
    project_id: string,
  ): Promise<NamespaceMetadata[]> {
    return httpClient.get<NamespaceMetadata[]>(
      `/projects/${project_id}/logs/namespaces`,
    );
  }

  static async sendTestLog(project_id: string): Promise<void> {
    return httpClient.post(`/projects/${project_id}/test-log`);
  }
}
