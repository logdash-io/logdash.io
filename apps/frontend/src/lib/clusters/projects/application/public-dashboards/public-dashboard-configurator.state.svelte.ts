export class PublicDashboardManagerState {
  private _dashboardMonitors = $state<Record<string, string[]>>({});
  private _loading = $state(true);
  private _creating = $state(false);

  get loading() {
    return this._loading;
  }

  get creating() {
    return this._creating;
  }

  getMonitors(dashboardId: string): string[] {
    return this._dashboardMonitors[dashboardId] || [];
  }

  async addMonitor(dashboardId: string, monitorId: string): Promise<void> {
    try {
      await fetch(
        `/app/api/public-dashboards/${dashboardId}/monitors/${monitorId}`,
        {
          method: 'POST',
        },
      );
      if (!this._dashboardMonitors[dashboardId]) {
        this._dashboardMonitors[dashboardId] = [];
      }
      if (!this._dashboardMonitors[dashboardId].includes(monitorId)) {
        this._dashboardMonitors[dashboardId].push(monitorId);
      }
    } catch (error) {
      console.error('Failed to add monitor to dashboard:', error);
      throw error;
    }
  }

  async removeMonitor(dashboardId: string, monitorId: string): Promise<void> {
    try {
      await fetch(
        `/app/api/public-dashboards/${dashboardId}/monitors/${monitorId}`,
        {
          method: 'DELETE',
        },
      );
      if (this._dashboardMonitors[dashboardId]) {
        this._dashboardMonitors[dashboardId] = this._dashboardMonitors[
          dashboardId
        ].filter((id) => id !== monitorId);
      }
    } catch (error) {
      console.error('Failed to remove monitor from dashboard:', error);
      throw error;
    }
  }

  async toggleMonitor(dashboardId: string, monitorId: string): Promise<void> {
    if (this._dashboardMonitors[dashboardId]) {
      if (this._dashboardMonitors[dashboardId].includes(monitorId)) {
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
      this._loading = true;
      const response = await fetch(
        `/app/api/clusters/${clusterId}/public-dashboards`,
      );
      const { data } = await response.json();
      this._dashboardMonitors = data.reduce(
        (acc, dashboard) => {
          acc[dashboard.id] = dashboard.httpMonitorsIds;
          return acc;
        },
        {} as Record<string, string[]>,
      );
      this._loading = false;
    } catch (error) {
      console.error('Failed to load public dashboards:', error);
    } finally {
      this._loading = false;
    }
  }

  getDashboardUrl(dashboardId: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/d/${dashboardId}`;
  }
}

export const publicDashboardManagerState = new PublicDashboardManagerState();
