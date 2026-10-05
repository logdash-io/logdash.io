import { analyticsWindow } from '$lib/domains/web-analytics/domain/analytics-period.js';
import { WebAnalyticsService } from '$lib/domains/web-analytics/infrastructure/web-analytics.service.js';

const POLLING_INTERVAL_MS = 30_000;

class DomainLiveState {
  private _online = $state<Record<string, number>>({});

  public online(clusterId: string): number {
    return this._online[clusterId] ?? 0;
  }

  public startPolling(clusterIds: string[]): () => void {
    void this.load(clusterIds);

    const timer = setInterval(() => {
      if (!document.hidden) {
        void this.load(clusterIds);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(timer);
  }

  private async load(clusterIds: string[]): Promise<void> {
    const { from, to } = analyticsWindow('today', 0);
    const range = {
      from,
      to,
      granularity: 'hour' as const,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      filters: [],
      compare: false,
    };

    await Promise.all(
      clusterIds.map(async (clusterId) => {
        try {
          const overview = await WebAnalyticsService.readOverview(
            clusterId,
            range,
          );
          this._online[clusterId] = overview.online;
        } catch {
          delete this._online[clusterId];
        }
      }),
    );
  }
}

export const domainLiveState = new DomainLiveState();
