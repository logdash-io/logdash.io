import queryString from 'query-string';
import type { Log } from '../domain/log';
import { httpClient } from '$lib/domains/shared/http/http-client';
import type { LogsQueryFilters } from '../domain/logs-query-filters';
import { logger } from '$lib/domains/shared/logger/index';
import type { NamespaceMetadata } from '../domain/namespace-metadata';

export class LogsService {
  static async getClusterLogs(
    cluster_id: string,
    filters: Partial<LogsQueryFilters>,
  ): Promise<Log[]> {
    logger.debug('getting domain logs', filters);

    const qs = queryString.stringify(
      {
        ...(filters.lastId && { lastId: filters.lastId }),
        ...(filters.direction && { direction: filters.direction }),
        limit: filters.limit ?? 50,
        ...(filters.searchString && { searchString: filters.searchString }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.levels?.length && { levels: filters.levels }),
        ...(filters.namespaces?.length && { namespaces: filters.namespaces }),
        ...(filters.apps?.length && { apps: filters.apps }),
      },
      { arrayFormat: 'none' },
    );

    return httpClient.get<Log[]>(`/clusters/${cluster_id}/logs?${qs}`);
  }

  static async getLogsNamespaces(
    cluster_id: string,
    apps: string[],
  ): Promise<NamespaceMetadata[]> {
    const qs = queryString.stringify({ apps }, { arrayFormat: 'none' });

    return httpClient.get<NamespaceMetadata[]>(
      `/clusters/${cluster_id}/logs/namespaces?${qs}`,
    );
  }
}
