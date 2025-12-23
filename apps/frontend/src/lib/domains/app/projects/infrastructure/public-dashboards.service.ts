import { httpClient } from '$lib/domains/shared/http/http-client';
import type { PublicDashboard } from '../domain/public-dashboards/public-dashboard';
import type { PublicDashboardData } from '@logdash/hyper-ui/features';

export class PublicDashboardsService {
  getPublicDashboards(clusterId: string): Promise<PublicDashboard[]> {
    return httpClient.get<PublicDashboard[]>(
      `/clusters/${clusterId}/public_dashboards`,
    );
  }

  getPublicDashboardData(
    dashboardId: string,
    period: '24h' | '7d' | '90d' = '90d',
  ): Promise<PublicDashboardData> {
    return httpClient.get<PublicDashboardData>(
      `/public_dashboards/${dashboardId}/data`,
      {
        params: {
          period,
        },
      },
    );
  }

  updatePublicDashboard(
    dashboardId: string,
    update: Partial<{ name: string; isPublic: boolean }>,
  ): Promise<PublicDashboard> {
    return httpClient.put<PublicDashboard>(
      `/public_dashboards/${dashboardId}`,
      update,
    );
  }

  addMonitorToDashboard(
    dashboardId: string,
    monitorId: string,
  ): Promise<PublicDashboard> {
    return httpClient.post<PublicDashboard>(
      `/public_dashboards/${dashboardId}/monitors/${monitorId}`,
      {},
    );
  }

  removeMonitorFromDashboard(
    dashboardId: string,
    monitorId: string,
  ): Promise<PublicDashboard> {
    return httpClient.delete<PublicDashboard>(
      `/public_dashboards/${dashboardId}/monitors/${monitorId}`,
    );
  }
}

export const publicDashboardsService = new PublicDashboardsService();
