import { publicDashboardsService } from '$lib/domains/app/projects/infrastructure/public-dashboards.service';
import { customDomainsState } from '$lib/domains/app/projects/application/public-dashboards/custom-domains.state.svelte.js';
import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard';

export class PublicDashboardManagerState {
  private _dashboards = $state<Record<PublicDashboard['id'], PublicDashboard>>(
    {},
  );

  get dashboards(): PublicDashboard[] {
    return Object.values(this._dashboards);
  }

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
      autoAddMonitors: boolean;
    }>,
  ): Promise<void> {
    try {
      const data = await publicDashboardsService.updatePublicDashboard(
        dashboardId,
        dto,
      );
      this._dashboards[data.id] = { ...this._dashboards[data.id], ...data };
    } catch (error) {
      console.error('Failed to update public dashboard:', error);
      throw error;
    }
  }

  async toggleMonitor(dashboardId: string, monitorId: string): Promise<void> {
    const dashboard = this._dashboards[dashboardId];

    if (!dashboard) {
      return;
    }

    const previousMonitorsIds = dashboard.httpMonitorsIds;
    const isAdding = !previousMonitorsIds.includes(monitorId);

    dashboard.httpMonitorsIds = isAdding
      ? [...previousMonitorsIds, monitorId]
      : previousMonitorsIds.filter((id) => id !== monitorId);

    try {
      await (isAdding
        ? publicDashboardsService.addMonitorToDashboard(dashboardId, monitorId)
        : publicDashboardsService.removeMonitorFromDashboard(
            dashboardId,
            monitorId,
          ));
    } catch (error) {
      dashboard.httpMonitorsIds = previousMonitorsIds;
      throw error;
    }
  }

  async delete(dashboardId: string): Promise<void> {
    await publicDashboardsService.deletePublicDashboard(dashboardId);
  }

  async loadPublicDashboards(clusterId: string): Promise<boolean> {
    try {
      const data = await publicDashboardsService.getPublicDashboards(clusterId);
      this._dashboards = data.reduce(
        (acc, dashboard) => {
          acc[dashboard.id] = dashboard;
          return acc;
        },
        {} as Record<PublicDashboard['id'], PublicDashboard>,
      );
      return true;
    } catch (error) {
      console.error('Failed to load public dashboards:', error);
      return false;
    }
  }

  getDashboardUrl(dashboardId: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/d/${dashboardId}`;
  }

  getStatusPageUrl(dashboardId: string): string {
    const customDomain = customDomainsState.hasLoaded(dashboardId)
      ? customDomainsState.getCustomDomain(dashboardId)
      : this._dashboards[dashboardId]?.customDomain;

    if (customDomain?.status === 'verified') {
      return `https://${customDomain.domain}`;
    }

    return this.getDashboardUrl(dashboardId);
  }
}

export const publicDashboardManagerState = new PublicDashboardManagerState();
