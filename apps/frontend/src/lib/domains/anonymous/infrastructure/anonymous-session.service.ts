import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import type {
  PingBucket,
  PingBucketPeriod,
  PingBucketsResponse,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import { httpClient } from '$lib/domains/shared/http/http-client';

const PINGS_LIMIT = 30;

export type AnonymousUserDto = {
  token: string;
  clusterId: string;
  clusterName: string;
};

export type DemoTargetDto = {
  clusterId: string;
  projectId: string;
};

type CreateAnonymousUserResponseDto = {
  token: string;
  cluster: { id: string; name: string };
};

export class AnonymousSessionService {
  public async createAnonymousUser(
    clusterName?: string,
  ): Promise<AnonymousUserDto> {
    const response = await httpClient.post<CreateAnonymousUserResponseDto>(
      '/users/anonymous',
      { clusterName },
      { requireAuth: false },
    );

    return {
      token: response.token,
      clusterId: response.cluster.id,
      clusterName: response.cluster.name,
    };
  }

  public createMonitor(
    clusterId: string,
    dto: { name: string; url: string },
    token: string,
  ): Promise<Monitor> {
    return httpClient.post<Monitor>(
      `/clusters/${clusterId}/http_monitors`,
      { name: dto.name, url: dto.url, mode: MonitorMode.PULL },
      { requireAuth: false, customToken: token },
    );
  }

  public claimMonitor(monitorId: string, token: string): Promise<void> {
    return httpClient.post<void>(
      `/http_monitors/${monitorId}/claim`,
      {},
      { requireAuth: false, customToken: token },
    );
  }

  public readPings(
    clusterId: string,
    monitorId: string,
    token: string,
  ): Promise<HttpPing[]> {
    return httpClient.get<HttpPing[]>(
      `/clusters/${clusterId}/monitors/${monitorId}/http_pings`,
      {
        params: { limit: PINGS_LIMIT },
        requireAuth: false,
        customToken: token,
      },
    );
  }

  public async readHistory(
    monitorId: string,
    period: PingBucketPeriod,
    token: string,
  ): Promise<(PingBucket | null)[]> {
    const response = await httpClient.get<PingBucketsResponse>(
      `/monitors/${monitorId}/http_ping_buckets`,
      {
        params: { period },
        requireAuth: false,
        customToken: token,
      },
    );

    return response.buckets.reverse();
  }

  public listClusters(token: string): Promise<Cluster[]> {
    return httpClient.get<Cluster[]>('/users/me/clusters', {
      requireAuth: false,
      customToken: token,
    });
  }

  public readDemo(): Promise<DemoTargetDto> {
    return httpClient.get<DemoTargetDto>('/demo', { requireAuth: false });
  }

  public readDemoMonitors(clusterId: string): Promise<Monitor[]> {
    return httpClient.get<Monitor[]>(`/clusters/${clusterId}/http_monitors`, {
      requireAuth: false,
    });
  }

  public async readDemoHistory(
    clusterId: string,
    monitorId: string,
  ): Promise<(PingBucket | null)[]> {
    const response = await httpClient.get<PingBucketsResponse>(
      `/clusters/${clusterId}/monitors/${monitorId}/http_ping_buckets`,
      { params: { period: '90h' }, requireAuth: false },
    );

    return response.buckets.reverse();
  }

  public readDemoPings(
    clusterId: string,
    monitorId: string,
  ): Promise<HttpPing[]> {
    return httpClient.get<HttpPing[]>(
      `/clusters/${clusterId}/monitors/${monitorId}/http_pings`,
      { params: { limit: PINGS_LIMIT }, requireAuth: false },
    );
  }
}

export const anonymousSessionService = new AnonymousSessionService();
