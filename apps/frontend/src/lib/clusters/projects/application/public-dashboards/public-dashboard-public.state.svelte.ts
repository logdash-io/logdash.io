import { logdashAPI } from '$lib/shared/logdash.api';
import { PublicDashboardState } from './public-dashboard.state.svelte';

export class PublicDashboardPublicState extends PublicDashboardState {
  // Implementation of abstract method for public dashboard loading
  async loadDashboard(dashboardId: string): Promise<void> {
    try {
      this.loading = true;

      const publicData =
        await logdashAPI.get_public_dashboard_public_data(dashboardId);
      this.dashboardData = publicData;

      this.lastUpdated = new Date();
    } catch (error) {
      console.error('Failed to load public dashboard:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }
}

export const publicDashboardPublicState = new PublicDashboardPublicState();
