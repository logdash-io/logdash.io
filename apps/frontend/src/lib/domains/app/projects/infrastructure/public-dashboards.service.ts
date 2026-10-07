import { httpClient } from '$lib/domains/shared/http/http-client';
import type { PublicDashboard } from '../domain/public-dashboards/public-dashboard';

export class PublicDashboardsService {
  getPublicDashboards(clusterId: string): Promise<PublicDashboard[]> {
    return httpClient.get<PublicDashboard[]>(
      `/clusters/${clusterId}/public_dashboards`,
    );
  }

  createPublicDashboard(
    clusterId: string,
    name: string,
  ): Promise<PublicDashboard> {
    return httpClient.post<PublicDashboard>(
      `/clusters/${clusterId}/public_dashboards`,
      {
        name,
        isPublic: false,
      },
    );
  }

  updatePublicDashboard(
    dashboardId: string,
    update: Partial<{
      name: string;
      isPublic: boolean;
      autoAddMonitors: boolean;
    }>,
  ): Promise<PublicDashboard> {
    return httpClient.put<PublicDashboard>(
      `/public_dashboards/${dashboardId}`,
      update,
    );
  }

  deletePublicDashboard(dashboardId: string): Promise<void> {
    return httpClient.delete<void>(`/public_dashboards/${dashboardId}`);
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
