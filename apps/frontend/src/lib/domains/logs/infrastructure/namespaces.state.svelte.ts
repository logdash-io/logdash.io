import type { NamespaceMetadata } from '../domain/namespace-metadata';
import { LogsService } from './logs.service';

class NamespacesState {
  private _namespaces = $state<NamespaceMetadata[]>([]);
  private _loading = $state(false);
  private _projectId: string | null = null;

  get namespaces(): NamespaceMetadata[] {
    return this._namespaces;
  }

  get loading(): boolean {
    return this._loading;
  }

  async init(projectId: string): Promise<void> {
    this._projectId = projectId;
    await this.fetch();
  }

  async fetch(): Promise<void> {
    if (!this._projectId || this._loading) return;

    this._loading = true;
    try {
      this._namespaces = await LogsService.getLogsNamespaces(this._projectId);
    } catch {
      this._namespaces = [];
    } finally {
      this._loading = false;
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
    this._projectId = null;
    this._loading = false;
  }
}

export const namespacesState = new NamespacesState();
