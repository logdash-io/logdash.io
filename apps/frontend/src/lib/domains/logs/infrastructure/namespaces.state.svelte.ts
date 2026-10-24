import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte';
import type { NamespaceMetadata } from '../domain/namespace-metadata';
import { LogsService } from './logs.service';

class NamespacesState {
  private _namespaces = $state<NamespaceMetadata[]>([]);
  private _loading = $state(false);
  private _scope: string | null = null;

  get namespaces(): NamespaceMetadata[] {
    return this._namespaces;
  }

  get loading(): boolean {
    return this._loading;
  }

  async init(clusterId: string, apps: string[]): Promise<void> {
    const scope = JSON.stringify([clusterId, apps]);

    if (this._scope === scope) return;

    this._scope = scope;
    this._loading = true;

    try {
      const namespaces = await LogsService.getLogsNamespaces(clusterId, apps);

      if (this._scope === scope) {
        this._namespaces = namespaces;
      }
    } catch {
      if (this._scope === scope) {
        toast.error('Failed to load namespaces. Please try again later.');
        this._namespaces = [];
      }
    } finally {
      if (this._scope === scope) {
        this._loading = false;
      }
    }
  }

  addFromLog(namespace: string | undefined): void {
    if (!namespace) return;

    const exists = this._namespaces.some((n) => n.namespace === namespace);
    if (exists) return;

    this._namespaces = [
      { namespace, lastLogDate: new Date().toISOString() },
      ...this._namespaces,
    ];
  }

  reset(): void {
    this._namespaces = [];
    this._scope = null;
    this._loading = false;
  }
}

export const namespacesState = new NamespacesState();
