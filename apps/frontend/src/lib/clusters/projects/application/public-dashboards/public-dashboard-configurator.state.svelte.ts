type Dashboard = {
  id: string;
  name: string;
  isPublic: boolean;
  httpMonitorsIds: string[];
};

export class PublicDashboardManagerState {
  private _dashboards = $state<Record<Dashboard['id'], Dashboard>>({});

  getDashboard(dashboardId: string): Dashboard | undefined {
    return this._dashboards[dashboardId];
  }

  async update(
    dashboardId: string,
    dto: Partial<{
      name: string;
      isPublic: boolean;
    }>,
  ): Promise<void> {
    try {
      const response = await fetch(
        `/app/api/public-dashboards/${dashboardId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dto),
        },
      );
      const { data } = await response.json();
      this._dashboards[data.id] = data;
    } catch (error) {
      console.error('Failed to create or update public dashboard:', error);
      throw error;
    }
  }

  async addMonitor(dashboardId: string, monitorId: string): Promise<void> {
    try {
      await fetch(
        `/app/api/public-dashboards/${dashboardId}/monitors/${monitorId}`,
        {
          method: 'POST',
        },
      );
      if (!this._dashboards[dashboardId]) {
        this._dashboards[dashboardId] = {
          id: dashboardId,
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
      await fetch(
        `/app/api/public-dashboards/${dashboardId}/monitors/${monitorId}`,
        {
          method: 'DELETE',
        },
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
      const response = await fetch(
        `/app/api/clusters/${clusterId}/public-dashboards`,
      );
      const { data } = await response.json();
      this._dashboards = data.reduce(
        (acc, dashboard) => {
          acc[dashboard.id] = dashboard;
          return acc;
        },
        {} as Record<Dashboard['id'], Dashboard>,
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
