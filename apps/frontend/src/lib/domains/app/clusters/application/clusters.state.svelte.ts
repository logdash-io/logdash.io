import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import { type Source } from 'sveltekit-sse';
import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import { ClustersService } from '$lib/domains/app/clusters/infrastructure/clusters.service.js';

// todo: divide api calls responsibility from state
class ClustersState {
  private _initialized = $state(false);
  private syncConnection: Source | null = null;
  private _requestStatus = $state<'deleting' | 'updating'>(null);

  private _clusters = $state<Record<Cluster['id'], Cluster>>({});

  get clusters(): Cluster[] {
    return Object.values(this._clusters).sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });
  }

  get isUpdating(): boolean {
    return this._requestStatus === 'updating';
  }

  get isDeleting(): boolean {
    return this._requestStatus === 'deleting';
  }

  get publishedDashboardsCount(): number {
    return this.clusters.reduce((acc, cluster) => {
      return (
        acc +
        (cluster.publicDashboards?.filter((dashboard) => dashboard.isPublic)
          ?.length || 0)
      );
    }, 0);
  }

  get allClustersProjectsCount(): number {
    return this.clusters.reduce((acc, cluster) => {
      return acc + (cluster.projects?.length || 0);
    }, 0);
  }

  get ready(): boolean {
    return this._initialized;
  }

  isUserClusterCreator(userId: string, clusterId: string): boolean {
    return this.get(clusterId)?.creatorId === userId;
  }

  get(id: string): Cluster | undefined {
    return this._clusters[id];
  }

  clusterName(id: string): string {
    return this._clusters[id]?.name || '';
  }

  setColorPreview(id: string, color: string | undefined): void {
    if (!this._clusters[id]) {
      return;
    }
    this._clusters[id] = {
      ...this._clusters[id],
      color,
    };
  }

  set(clusters: Cluster[]): void {
    this._clusters = arrayToObject(clusters, 'id');
    this._initialized = true;
  }

  create(name: string): Promise<Cluster['id']> {
    return fetch(`/app/api/clusters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((cluster) => {
        this._clusters[cluster.id] = cluster;
        return cluster.id;
      });
  }

  async update(id: string, update: Partial<Cluster>): Promise<void> {
    const existingCluster = this._clusters[id];

    if (!existingCluster) {
      throw new Error(`Cluster with id ${id} does not exist`);
    }

    const hasNameChange =
      update.name !== undefined && existingCluster.name !== update.name;
    const hasColorChange =
      update.color !== undefined && existingCluster.color !== update.color;

    if (!hasNameChange && !hasColorChange) {
      return;
    }

    this._clusters[id] = {
      ...this._clusters[id],
      ...(hasNameChange && { name: update.name }),
      ...(hasColorChange && { color: update.color }),
    };

    this._requestStatus = 'updating';

    await fetch(`/app/api/clusters/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: this._clusters[id].name,
        color: this._clusters[id].color,
      }),
    }).finally(() => {
      this._requestStatus = null;
    });
  }

  async delete(id: string): Promise<void> {
    this._requestStatus = 'deleting';
    try {
      // todo: validate why it returns false positive on error
      await fetch(`/app/api/clusters/${id}`, {
        method: 'DELETE',
      });
      delete this._clusters[id];
    } catch (error) {
      toast.error(`Failed to delete cluster: ${error}`);
    } finally {
      this._requestStatus = null;
    }
  }

  async load(): Promise<void> {
    const clusters = await ClustersService.getClusters();
    this.set(clusters);
  }
}

export const clustersState = new ClustersState();
