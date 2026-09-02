import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import { httpClient } from '$lib/domains/shared/http/http-client';
import type { Feature } from '$lib/domains/shared/types';

const PINGS_LIMIT = 30;

export type AnonymousUserDto = {
  token: string;
  clusterId: string;
};

export type CreatedProjectDto = {
  projectId: string;
  apiKey: string;
};

export type DemoTargetDto = {
  clusterId: string;
  projectId: string;
};

type CreateAnonymousUserResponseDto = {
  token: string;
  cluster: { id: string };
};

type CreateProjectResponseDto = {
  project: { id: string };
  apiKey: string;
};

export class AnonymousSessionService {
  public async createAnonymousUser(): Promise<AnonymousUserDto> {
    const response = await httpClient.post<CreateAnonymousUserResponseDto>(
      '/users/anonymous',
      {},
      { requireAuth: false },
    );

    return { token: response.token, clusterId: response.cluster.id };
  }

  public async createProject(
    clusterId: string,
    name: string,
    features: Feature[],
    token: string,
  ): Promise<CreatedProjectDto> {
    const response = await httpClient.post<CreateProjectResponseDto>(
      `/clusters/${clusterId}/projects`,
      { name, selectedFeatures: features },
      { requireAuth: false, customToken: token },
    );

    return { projectId: response.project.id, apiKey: response.apiKey };
  }

  public createMonitor(
    projectId: string,
    dto: { name: string; url: string },
    token: string,
  ): Promise<Monitor> {
    return httpClient.post<Monitor>(
      `/projects/${projectId}/http_monitors`,
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
    projectId: string,
    monitorId: string,
    token: string,
  ): Promise<HttpPing[]> {
    return httpClient.get<HttpPing[]>(
      `/projects/${projectId}/monitors/${monitorId}/http_pings`,
      {
        params: { limit: PINGS_LIMIT },
        requireAuth: false,
        customToken: token,
      },
    );
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

  public readDemoPings(
    projectId: string,
    monitorId: string,
  ): Promise<HttpPing[]> {
    return httpClient.get<HttpPing[]>(
      `/projects/${projectId}/monitors/${monitorId}/http_pings`,
      { params: { limit: PINGS_LIMIT }, requireAuth: false },
    );
  }
}

export const anonymousSessionService = new AnonymousSessionService();
