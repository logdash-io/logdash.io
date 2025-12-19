import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import { ClusterHealthService } from '$lib/domains/app/clusters/infrastructure/cluster-health.service.js';
import { SvelteSet } from 'svelte/reactivity';

const POLLING_INTERVAL_MS = 30000;

type ClusterHealthStateType = {
  monitorsByClusterId: Record<string, Monitor[]>;
  loadingClusterIds: Set<string>;
};

class ClusterHealthState {
  private _state = $state<ClusterHealthStateType>({
    monitorsByClusterId: {},
    loadingClusterIds: new Set(),
  });

  private _pollingIntervals: Map<string, ReturnType<typeof setInterval>> =
    new Map();

  public getMonitors(clusterId: string): Monitor[] {
    return this._state.monitorsByClusterId[clusterId] ?? [];
  }

  public getMonitorByProjectId(
    clusterId: string,
    projectId: string,
  ): Monitor | undefined {
    const monitors = this.getMonitors(clusterId);
    return monitors.find((m) => m.projectId === projectId);
  }

  public isLoading(clusterId: string): boolean {
    return this._state.loadingClusterIds.has(clusterId);
  }

  public startPolling(clusterIds: string[]): () => void {
    for (const clusterId of clusterIds) {
      if (this._pollingIntervals.has(clusterId)) {
        continue;
      }

      this.loadHealthData(clusterId);

      const interval = setInterval(() => {
        this.loadHealthData(clusterId, true);
      }, POLLING_INTERVAL_MS);

      this._pollingIntervals.set(clusterId, interval);
    }

    return () => this.stopPolling(clusterIds);
  }

  public stopPolling(clusterIds: string[]): void {
    for (const clusterId of clusterIds) {
      const interval = this._pollingIntervals.get(clusterId);
      if (interval) {
        clearInterval(interval);
        this._pollingIntervals.delete(clusterId);
      }
    }
  }

  public stopAllPolling(): void {
    for (const interval of this._pollingIntervals.values()) {
      clearInterval(interval);
    }
    this._pollingIntervals.clear();
  }

  public async loadHealthData(
    clusterId: string,
    silent = false,
  ): Promise<void> {
    if (!silent) {
      this._state.loadingClusterIds = new Set([
        ...this._state.loadingClusterIds,
        clusterId,
      ]);
    }

    try {
      const monitors = await ClusterHealthService.getClusterMonitors(clusterId);
      this._state.monitorsByClusterId = {
        ...this._state.monitorsByClusterId,
        [clusterId]: monitors,
      };
    } catch (error) {
      console.error(
        `Failed to load health data for cluster ${clusterId}:`,
        error,
      );
    } finally {
      if (!silent) {
        const newLoadingSet = new SvelteSet(this._state.loadingClusterIds);
        newLoadingSet.delete(clusterId);
        this._state.loadingClusterIds = newLoadingSet;
      }
    }
  }

  public reset(): void {
    this.stopAllPolling();
    this._state.monitorsByClusterId = {};
    this._state.loadingClusterIds = new Set();
  }
}

export const clusterHealthState = new ClusterHealthState();
