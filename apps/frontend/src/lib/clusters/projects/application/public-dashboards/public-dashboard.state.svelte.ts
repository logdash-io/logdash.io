import type { PublicDashboardData } from '../../domain/public-dashboards/public-dashboard-data.js';

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

    if (healthyMonitors.length === this.dashboardData.httpMonitors.length) {
      return 'operational';
    } else if (healthyMonitors.length > 0) {
      return 'degraded';
    } else {
      return 'outage';
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
  ): 'up' | 'down' | 'unknown' {
    if (!monitor.pings.length) return 'unknown';

    const latestPing = monitor.pings[0];
    return latestPing.statusCode >= 200 && latestPing.statusCode < 400
      ? 'up'
      : 'down';
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

  getAverageResponseTime(
    monitor: PublicDashboardData['httpMonitors'][0],
  ): number {
    if (!monitor.pings.length) return 0;

    const recentPings = monitor.pings.slice(0, 20); // Last 20 pings
    const totalTime = recentPings.reduce(
      (sum, ping) => sum + ping.responseTimeMs,
      0,
    );
    return totalTime / recentPings.length;
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

  // Get average response time from buckets
  getAverageResponseTimeFromBuckets(
    monitor: PublicDashboardData['httpMonitors'][0],
    days: number = 7,
  ): number {
    if (!monitor.buckets?.length) return this.getAverageResponseTime(monitor);

    const recentBuckets = monitor.buckets
      .filter((bucket) => bucket !== null) // Filter out null buckets
      .slice(0, days);

    if (!recentBuckets.length) return 0;

    let totalLatency = 0;
    let totalChecks = 0;

    for (const bucket of recentBuckets) {
      const bucketChecks = bucket.successCount + bucket.failureCount;
      totalLatency += bucket.averageLatencyMs * bucketChecks;
      totalChecks += bucketChecks;
    }

    return totalChecks > 0 ? totalLatency / totalChecks : 0;
  }

  // Enhanced system status that considers both recent pings and bucket history
  get systemStatusEnhanced():
    | 'operational'
    | 'degraded'
    | 'outage'
    | 'unknown' {
    if (!this.dashboardData?.httpMonitors.length) return 'unknown';

    const monitorStatuses = this.dashboardData.httpMonitors.map((monitor) => {
      // Check recent pings for immediate status
      const recentStatus = this.getMonitorStatus(monitor);

      // Check bucket-based uptime for historical reliability
      const bucketUptime = this.getUptimeFromBuckets(monitor, 1); // Last day

      if (recentStatus === 'down' || bucketUptime < 50) {
        return 'outage';
      } else if (recentStatus === 'unknown' || bucketUptime < 95) {
        return 'degraded';
      } else {
        return 'operational';
      }
    });

    const operationalCount = monitorStatuses.filter(
      (s) => s === 'operational',
    ).length;
    const degradedCount = monitorStatuses.filter(
      (s) => s === 'degraded',
    ).length;
    const outageCount = monitorStatuses.filter((s) => s === 'outage').length;

    if (outageCount > 0) return 'outage';
    if (degradedCount > 0) return 'degraded';
    if (operationalCount === monitorStatuses.length) return 'operational';
    return 'unknown';
  }
}
