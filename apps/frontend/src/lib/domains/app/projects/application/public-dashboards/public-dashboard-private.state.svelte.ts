import { logdashAPI } from '$lib/domains/shared/logdash.api';
import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils.js';
import { PublicDashboardState } from '@logdash/hyper-ui/features';

export class PublicDashboardPrivateState extends PublicDashboardState {
  // Implementation of abstract method for private dashboard loading
  async loadDashboard(dashboardId: string): Promise<void> {
    try {
      this.loading = true;

      // This calls the private/authenticated endpoint
      const data = await logdashAPI.get_public_dashboard_data(
        dashboardId,
        getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie),
      );
      this.dashboardData = data;

      this.lastUpdated = new Date();
    } catch (error) {
      console.error('Failed to load private dashboard:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }
}

export const publicDashboardPrivateState = new PublicDashboardPrivateState();
