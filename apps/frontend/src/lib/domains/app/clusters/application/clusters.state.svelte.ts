import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import { type Source } from 'sveltekit-sse';
import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import {
  ownedUsage,
  type OwnedUsage,
} from '$lib/domains/app/clusters/domain/owned-usage';
import { ClustersService } from '$lib/domains/app/clusters/infrastructure/clusters.service.js';
import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

const CUSTOM_DOMAIN_TIERS = ['pro', 'admin'];

// todo: divide api calls responsibility from state
class ClustersState {
  private _initialized = $state(false);
  private syncConnection: Source | null = null;
  private _requestStatus = $state<'deleting' | 'updating' | null>(null);

  private _clusters = $state<Record<Cluster['id'], Cluster>>({});
  private _draft = $state<Cluster | null>(null);

  get clusters(): Cluster[] {
    const clusters = Object.values(this._clusters).sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });

    return this._draft ? [...clusters, this._draft] : clusters;
  }

  get isUpdating(): boolean {
    return this._requestStatus === 'updating';
  }

  get isDeleting(): boolean {
    return this._requestStatus === 'deleting';
  }

  get canAddDomain(): boolean {
    const limit = exposedConfigState.maxNumberOfProjects(userState.tier);

    return this.owned.domains < limit && this.owned.services < limit;
  }

  canCreateStatusPage(clusterId: string): boolean {
    if (this.get(clusterId)?.creatorId !== userState.id) {
      return true;
    }

    return (
      this.owned.statusPages <
      exposedConfigState.maxNumberOfPublicDashboards(userState.tier)
    );
  }

  private get owned(): OwnedUsage {
    return ownedUsage(this.clusters, userState.id);
  }

  get ready(): boolean {
    return this._initialized;
  }

  isUserClusterCreator(userId: string, clusterId: string): boolean {
    return this.get(clusterId)?.creatorId === userId;
  }

  canSetupCustomDomain(clusterId: string): boolean {
    return CUSTOM_DOMAIN_TIERS.includes(this.get(clusterId)?.tier ?? '');
  }

  get(id: string | undefined): Cluster | undefined {
    if (!id) {
      return undefined;
    }

    return this._draft?.id === id ? this._draft : this._clusters[id];
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

  renameProject(projectId: string, name: string): void {
    const project = this.clusters
      .flatMap((cluster) => cluster.projects ?? [])
      .find(({ id }) => id === projectId);

    if (project) {
      project.name = name;
    }
  }

  set(clusters: Cluster[]): void {
    this._clusters = arrayToObject(clusters, 'id');
    this._initialized = true;
  }

  setDraft(cluster: Cluster | null): void {
    this._draft = cluster;
  }

  async update(
    id: string,
    changes: Partial<Pick<Cluster, 'name' | 'color'>>,
  ): Promise<void> {
    const existingCluster = this._clusters[id];

    if (!existingCluster) {
      throw new Error(`Cluster with id ${id} does not exist`);
    }

    const updatedCluster = { ...existingCluster, ...changes };
    this._clusters[id] = updatedCluster;
    this._requestStatus = 'updating';

    try {
      await ClustersService.updateCluster(id, {
        name: updatedCluster.name,
        color: updatedCluster.color,
      });
    } catch (error) {
      this._clusters[id] = existingCluster;
      throw error;
    } finally {
      this._requestStatus = null;
    }
  }

  async delete(id: string): Promise<void> {
    this._requestStatus = 'deleting';
    try {
      await ClustersService.deleteCluster(id);
      delete this._clusters[id];
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
