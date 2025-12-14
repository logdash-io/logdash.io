import { publicDashboardsService } from '$lib/domains/app/projects/infrastructure/public-dashboards.service';
import { PublicDashboardState } from '@logdash/hyper-ui/features';
import { SvelteDate } from 'svelte/reactivity';

export class PublicDashboardPrivateState extends PublicDashboardState {
  async loadDashboard(dashboardId: string): Promise<void> {
    try {
      this.loading = true;

      const data = await publicDashboardsService.getPublicDashboardData(dashboardId);
      this.dashboardData = data;

      this.lastUpdated = new SvelteDate();
    } catch (error) {
      console.error('Failed to load private dashboard:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }
}

export const publicDashboardPrivateState = new PublicDashboardPrivateState();
