import { httpClient } from '$lib/domains/shared/http/http-client';
import type {
  PingBucketsResponse,
  PingBucketPeriod,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';

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
}

export const monitoringService = new MonitoringService();
