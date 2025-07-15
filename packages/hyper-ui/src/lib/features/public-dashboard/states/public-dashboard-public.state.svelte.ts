import { PublicDashboardState } from "@logdash/hyper-ui/features";
import { PublicDashboardService } from "../services";

export class PublicDashboardPublicState extends PublicDashboardState {
  async loadDashboard(dashboardId: string): Promise<void> {
    try {
      this.loading = true;

      const publicData =
        await PublicDashboardService.getPublicData(dashboardId);
      this.dashboardData = publicData;

      this.lastUpdated = new Date();
    } catch (error) {
      console.error("Failed to load public dashboard:", error);
      throw error;
    } finally {
      this.loading = false;
    }
  }
}

export const publicDashboardPublicState = new PublicDashboardPublicState();
