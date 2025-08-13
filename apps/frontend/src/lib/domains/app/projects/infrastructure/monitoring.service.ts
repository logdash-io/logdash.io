import { httpClient } from '$lib/domains/shared/http/http-client';
import type {
  PingBucketsResponse,
  PingBucketPeriod,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import type { MonitorMode } from '../domain/monitoring/monitor-mode.js';
import type { Monitor } from '../domain/monitoring/monitor.js';

export type CreateMonitorDto = {
  projectId: string;
  name: string;
  mode: MonitorMode;
  url?: string;
};

export class MonitoringService {
  getPingBuckets(
    monitorId: string,
    period: PingBucketPeriod,
  ): Promise<PingBucketsResponse> {
    return httpClient.get<PingBucketsResponse>(
      `/monitors/${monitorId}/http_ping_buckets`,
      {
        params: {
          period,
        },
      },
    );
  }

  getMonitors(clusterId: string): Promise<Monitor[]> {
    return httpClient.get<Monitor[]>(`/clusters/${clusterId}/http_monitors`);
  }

  getMonitorPings(dto: {
    projectId: string;
    monitorId: string;
    limit: number;
  }): Promise<HttpPing[]> {
    return httpClient.get<HttpPing[]>(
      `/projects/${dto.projectId}/monitors/${dto.monitorId}/http_pings`,
      {
        params: {
          limit: dto.limit,
        },
      },
    );
  }

  createMonitor(projectId: string, dto: CreateMonitorDto): Promise<Monitor> {
    return httpClient.post<Monitor>(`/projects/${projectId}/http_monitors`, {
      name: dto.name,
      mode: dto.mode,
      url: dto.url,
    });
  }

  claimMonitor(httpMonitorId: string): Promise<Monitor> {
    return httpClient.post<Monitor>(
      `/http_monitors/${httpMonitorId}/claim`,
      {},
    );
  }
}

export const monitoringService = new MonitoringService();
