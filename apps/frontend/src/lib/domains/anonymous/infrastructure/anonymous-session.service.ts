import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import {
  MetricGranularity,
  type Metric,
  type SimplifiedMetric,
} from '$lib/domains/app/projects/domain/metric';
import type { Log } from '$lib/domains/logs/domain/log';
import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response';
import { httpClient } from '$lib/domains/shared/http/http-client';
import type { Feature } from '$lib/domains/shared/types';

const PINGS_LIMIT = 30;
const DEMO_LOGS_LIMIT = 20;
const DEMO_METRIC_HISTORY_LIMIT = 60;

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

  public readDemoLogs(projectId: string): Promise<Log[]> {
    return httpClient.get<Log[]>(`/projects/${projectId}/logs/v2`, {
      params: { limit: DEMO_LOGS_LIMIT },
      requireAuth: false,
    });
  }

  /** Both dates should be rounded so every visitor asks the same question and the API cache answers it. */
  public readDemoLogVolume(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LogsAnalyticsResponse> {
    return httpClient.get<LogsAnalyticsResponse>(
      `/projects/${projectId}/logs/analytics/v1`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        requireAuth: false,
      },
    );
  }

  public readDemoMetrics(projectId: string): Promise<SimplifiedMetric[]> {
    return httpClient.get<SimplifiedMetric[]>(
      `/projects/${projectId}/metrics`,
      {
        requireAuth: false,
      },
    );
  }

  /** The last hour, one value per minute, oldest first. */
  public async readDemoMetricHistory(
    projectId: string,
    metricRegisterEntryId: string,
  ): Promise<number[]> {
    const entries = await httpClient.get<Metric[]>(
      `/projects/${projectId}/metrics/${metricRegisterEntryId}`,
      {
        params: {
          granularity: MetricGranularity.MINUTE,
          limit: DEMO_METRIC_HISTORY_LIMIT,
        },
        requireAuth: false,
      },
    );

    return entries
      .filter((entry) => entry.granularity === MetricGranularity.MINUTE)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-DEMO_METRIC_HISTORY_LIMIT)
      .map((entry) => entry.value);
  }
}

export const anonymousSessionService = new AnonymousSessionService();
