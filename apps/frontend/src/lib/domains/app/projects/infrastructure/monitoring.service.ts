import { httpClient } from '$lib/domains/shared/http/http-client';
import type {
  PingBucketsResponse,
  PingBucketPeriod,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';

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
}

export const monitoringService = new MonitoringService();
