import { httpClient } from "../../../utils/http-client";
import type { PublicDashboardData } from "../types";

export class PublicDashboardService {
  static async getPublicData(
    dashboardId: string,
    period: "24h" | "7d" | "90d" = "90d"
  ): Promise<PublicDashboardData> {
    return httpClient.get<PublicDashboardData>(
      `/public_dashboards/${dashboardId}/public_data?period=${period}`,
      { requireAuth: false }
    );
  }

  static async getDashboardIdByUrl(url: string): Promise<string> {
    const response = await httpClient.get<{ dashboard_id: string }>(
      `/public_dashboards/${url}/public_data?period=24h`
    );
    console.log("response", response);
    return response.dashboard_id;
  }
}
