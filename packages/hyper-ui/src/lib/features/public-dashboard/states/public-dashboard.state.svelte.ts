import type { PublicDashboardData } from "../types";
import { getStatusFromPings } from "../utils";

export abstract class PublicDashboardState {
  protected dashboardData = $state<PublicDashboardData | null>(null);
  protected loading = $state(false);
  protected lastUpdated = $state<Date>(new Date());

  get data(): PublicDashboardData | null {
    return this.dashboardData;
  }

  get isLoading(): boolean {
    return this.loading;
  }

  get lastUpdate(): Date {
    return this.lastUpdated;
  }

  get systemStatus(): "operational" | "degraded" | "outage" | "unknown" {
    if (!this.dashboardData?.httpMonitors.length) return "unknown";

    const healthyMonitors = this.dashboardData.httpMonitors.filter(
      (monitor) => {
        if (!monitor.pings.length) return false;
        const latestPing = monitor.pings[0];
        return latestPing.statusCode >= 200 && latestPing.statusCode < 400;
      }
    );

    const monitorsWithRecentErrors = this.dashboardData.httpMonitors.filter(
      (monitor) => {
        if (!monitor.pings.length) return false;
        const recentPings = monitor.pings.slice(0, 10); // Get the 10 most recent pings
        return recentPings.some(
          (ping) => ping.statusCode < 200 || ping.statusCode >= 400
        );
      }
    );

    if (healthyMonitors.length === 0) {
      return "outage";
    } else if (monitorsWithRecentErrors.length > 0) {
      return "degraded";
    } else {
      return "operational";
    }
  }

  abstract loadDashboard(
    dashboardId: string,
    ...args: unknown[]
  ): Promise<void>;

  setDashboardData(data: PublicDashboardData): void {
    this.dashboardData = data;
    this.lastUpdated = new Date();
  }

  getMonitorStatus(
    monitor: PublicDashboardData["httpMonitors"][0]
  ): "up" | "down" | "degraded" | "unknown" {
    return getStatusFromPings(monitor.pings);
  }

  getUptimePercentage(
    monitor: PublicDashboardData["httpMonitors"][0],
    days: number = 30
  ): number {
    if (!monitor.pings.length) return 0;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentPings = monitor.pings.filter(
      (ping) => new Date(ping.createdAt) > cutoff
    );

    if (!recentPings.length) return 0;

    const successfulPings = recentPings.filter(
      (ping) => ping.statusCode >= 200 && ping.statusCode < 400
    );

    return (successfulPings.length / recentPings.length) * 100;
  }

  getUptimeFromBuckets(
    monitor: PublicDashboardData["httpMonitors"][0],
    days: number = 30
  ): number {
    if (!monitor.buckets?.length)
      return this.getUptimePercentage(monitor, days);

    const recentBuckets = monitor.buckets
      .filter((bucket) => bucket !== null)
      .slice(0, days);

    if (!recentBuckets.length) return 0;

    let totalSuccessful = 0;
    let totalChecks = 0;

    for (const bucket of recentBuckets) {
      totalSuccessful += bucket.successCount;
      totalChecks += bucket.successCount + bucket.failureCount;
    }

    return totalChecks > 0 ? (totalSuccessful / totalChecks) * 100 : 0;
  }
}
