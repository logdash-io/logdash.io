import { publicDashboardsService } from '$lib/domains/app/projects/infrastructure/public-dashboards.service';
import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard';

export class PublicDashboardManagerState {
  private _dashboards = $state<Record<PublicDashboard['id'], PublicDashboard>>(
    {},
  );

  getDashboard(dashboardId: string): PublicDashboard | undefined {
    return this._dashboards[dashboardId];
  }

  async create(clusterId: string, name: string): Promise<PublicDashboard> {
    try {
      const data = await publicDashboardsService.createPublicDashboard(
        clusterId,
        name,
      );
      this._dashboards[data.id] = data;
      return data;
    } catch (error) {
      console.error('Failed to create status page:', error);
      throw error;
    }
  }

  async update(
    dashboardId: string,
    dto: Partial<{
      name: string;
      isPublic: boolean;
    }>,
  ): Promise<void> {
    try {
      const data = await publicDashboardsService.updatePublicDashboard(
        dashboardId,
        dto,
      );
      this._dashboards[data.id] = data;
    } catch (error) {
      console.error('Failed to update public dashboard:', error);
      throw error;
    }
  }

  async addMonitor(dashboardId: string, monitorId: string): Promise<void> {
    try {
      await publicDashboardsService.addMonitorToDashboard(
        dashboardId,
        monitorId,
      );
      if (!this._dashboards[dashboardId]) {
        this._dashboards[dashboardId] = {
          id: dashboardId,
          clusterId: '',
          name: '',
          isPublic: false,
          httpMonitorsIds: [],
        };
      }
      if (!this._dashboards[dashboardId].httpMonitorsIds.includes(monitorId)) {
        this._dashboards[dashboardId].httpMonitorsIds.push(monitorId);
      }
    } catch (error) {
      console.error('Failed to add monitor to dashboard:', error);
      throw error;
    }
  }

  async removeMonitor(dashboardId: string, monitorId: string): Promise<void> {
    try {
      await publicDashboardsService.removeMonitorFromDashboard(
        dashboardId,
        monitorId,
      );
      if (this._dashboards[dashboardId]) {
        this._dashboards[dashboardId].httpMonitorsIds = this._dashboards[
          dashboardId
        ].httpMonitorsIds.filter((id) => id !== monitorId);
      }
    } catch (error) {
      console.error('Failed to remove monitor from dashboard:', error);
      throw error;
    }
  }

  async toggleMonitor(dashboardId: string, monitorId: string): Promise<void> {
    if (this._dashboards[dashboardId]) {
      if (this._dashboards[dashboardId].httpMonitorsIds.includes(monitorId)) {
        await this.removeMonitor(dashboardId, monitorId);
      } else {
        await this.addMonitor(dashboardId, monitorId);
      }
    } else {
      await this.addMonitor(dashboardId, monitorId);
    }
  }

  async loadPublicDashboards(clusterId: string): Promise<void> {
    try {
      const data = await publicDashboardsService.getPublicDashboards(clusterId);
      this._dashboards = data.reduce(
        (acc, dashboard) => {
          acc[dashboard.id] = dashboard;
          return acc;
        },
        {} as Record<PublicDashboard['id'], PublicDashboard>,
      );
    } catch (error) {
      console.error('Failed to load public dashboards:', error);
    }
  }

  getDashboardUrl(dashboardId: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/d/${dashboardId}`;
  }
}

export const publicDashboardManagerState = new PublicDashboardManagerState();
