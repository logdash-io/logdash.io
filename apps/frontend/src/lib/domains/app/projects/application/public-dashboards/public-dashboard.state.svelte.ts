import type { PublicDashboardData } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard-data.js';

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

  get systemStatus(): 'operational' | 'degraded' | 'outage' | 'unknown' {
    if (!this.dashboardData?.httpMonitors.length) return 'unknown';

    const healthyMonitors = this.dashboardData.httpMonitors.filter(
      (monitor) => {
        if (!monitor.pings.length) return false;
        const latestPing = monitor.pings[0];
        return latestPing.statusCode >= 200 && latestPing.statusCode < 400;
      },
    );

    const monitorsWithRecentErrors = this.dashboardData.httpMonitors.filter(
      (monitor) => {
        if (!monitor.pings.length) return false;
        const recentPings = monitor.pings.slice(0, 10); // Get the 10 most recent pings
        return recentPings.some(
          (ping) => ping.statusCode < 200 || ping.statusCode >= 400,
        );
      },
    );

    if (healthyMonitors.length === 0) {
      return 'outage';
    } else if (monitorsWithRecentErrors.length > 0) {
      return 'degraded';
    } else {
      return 'operational';
    }
  }

  // Common interface methods (to be implemented by subclasses)
  abstract loadDashboard(
    dashboardId: string,
    ...args: unknown[]
  ): Promise<void>;

  // Set dashboard data directly (for injected state scenarios)
  setDashboardData(data: PublicDashboardData): void {
    this.dashboardData = data;
    this.lastUpdated = new Date();
  }

  // Common utility methods
  getMonitorStatus(
    monitor: PublicDashboardData['httpMonitors'][0],
  ): 'up' | 'down' | 'degraded' | 'unknown' {
    if (!monitor.pings.length) return 'unknown';

    const latestPing = monitor.pings[0];
    const latestIsHealthy =
      latestPing.statusCode >= 200 && latestPing.statusCode < 400;

    if (!latestIsHealthy) {
      return 'down';
    }

    // Check if any of the 10 most recent pings was an error
    const recentPings = monitor.pings.slice(0, 10);
    const hasRecentErrors = recentPings.some(
      (ping) => ping.statusCode < 200 || ping.statusCode >= 400,
    );

    if (hasRecentErrors) {
      return 'degraded';
    }

    return 'up';
  }

  getUptimePercentage(
    monitor: PublicDashboardData['httpMonitors'][0],
    days: number = 30,
  ): number {
    if (!monitor.pings.length) return 0;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentPings = monitor.pings.filter(
      (ping) => new Date(ping.createdAt) > cutoff,
    );

    if (!recentPings.length) return 0;

    const successfulPings = recentPings.filter(
      (ping) => ping.statusCode >= 200 && ping.statusCode < 400,
    );

    return (successfulPings.length / recentPings.length) * 100;
  }

  // Bucket-based uptime calculation (more accurate for status pages)
  getUptimeFromBuckets(
    monitor: PublicDashboardData['httpMonitors'][0],
    days: number = 30,
  ): number {
    if (!monitor.buckets?.length)
      return this.getUptimePercentage(monitor, days);

    const recentBuckets = monitor.buckets
      .filter((bucket) => bucket !== null) // Filter out null buckets
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
