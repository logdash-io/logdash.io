import type { ClusterPulse } from '$lib/domains/app/clusters/domain/cluster.js';
import { ClustersService } from '$lib/domains/app/clusters/infrastructure/clusters.service.js';

const POLLING_INTERVAL_MS = 30_000;

class ClusterPulseState {
  private _pulses = $state<Record<string, ClusterPulse>>({});

  public online(clusterId: string): number {
    return this._pulses[clusterId]?.online ?? 0;
  }

  public down(clusterId: string): number {
    return this._pulses[clusterId]?.downMonitorIds.length ?? 0;
  }

  public setMonitorDown(
    clusterId: string,
    monitorId: string,
    down: boolean,
  ): void {
    const pulse = this._pulses[clusterId];

    if (!pulse) {
      return;
    }

    const others = pulse.downMonitorIds.filter((id) => id !== monitorId);
    pulse.downMonitorIds = down ? [...others, monitorId] : others;
  }

  public startPolling(): () => void {
    void this.load();

    const timer = setInterval(() => {
      if (!document.hidden) {
        void this.load();
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(timer);
  }

  private async load(): Promise<void> {
    try {
      const pulses = await ClustersService.getPulses();
      this._pulses = Object.fromEntries(
        pulses.map((pulse) => [pulse.clusterId, pulse]),
      );
    } catch {
      return;
    }
  }
}

export const clusterPulseState = new ClusterPulseState();
