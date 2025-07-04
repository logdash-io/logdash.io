import queryString from 'query-string';
import type { Log } from '../domain/log.js';
import { httpClient } from '$lib/domains/shared/http/http-client.js';

export class LogsService {
  static async getProjectLogs(
    project_id: string,
    limit: number = 50,
    after?: string,
    query?: string,
  ): Promise<Log[]> {
    const qs = queryString.stringify({
      limit,
      lastId: after,
      ...(after && { direction: 'before' }),
      ...(query && { search: query }),
    });

    return httpClient.get<Log[]>(`/projects/${project_id}/logs/v2?${qs}`);
  }
}
