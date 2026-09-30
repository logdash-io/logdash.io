import type { Log } from '$lib/domains/logs/domain/log';
import { createLogger } from '$lib/domains/shared/logger';
import { untrack } from 'svelte';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import type { LogsFilters } from '../domain/logs-filters';
import { filtersStore } from '../infrastructure/filters.store.svelte';
import { logsSyncService } from '../infrastructure/logs-sync.service.svelte';
import { LogsService } from '../infrastructure/logs.service';
import { namespacesState } from '../infrastructure/namespaces.state.svelte';

const logger = createLogger('logs.state', false);

const MAX_LOGS = 3000;

function trimLogsObject(logs: Record<Log['id'], Log>): Record<Log['id'], Log> {
  const logIds = Object.keys(logs);
  if (logIds.length <= MAX_LOGS) {
    return logs;
  }

  const sortedLogs = Object.values(logs).sort((a, b) => {
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    return 0;
  });

  const logsToKeep = sortedLogs.slice(logIds.length - MAX_LOGS);
  logger.debug(
    `Trimmed ${logIds.length - MAX_LOGS} old logs, keeping ${MAX_LOGS}`,
  );
  return arrayToObject(logsToKeep, 'id');
}

class LogsState {
  private _loadingPage = $state(false);
  private _fetchingLogs = $state(false);
  private _fetchFailed = $state(false);
  private _projectId: string | null = $state(null);
  private _generation = 0;

  private _logs = $state.raw<Record<Log['id'], Log>>({});

  private _sortedLogs = $derived.by(() => {
    return Object.values(this._logs).sort((a, b) => {
      if (a.createdAt < b.createdAt) {
        return 1;
      }
      if (a.createdAt > b.createdAt) {
        return -1;
      }
      if (a.sequenceNumber !== undefined && b.sequenceNumber !== undefined) {
        return b.sequenceNumber - a.sequenceNumber;
      }
      return 0;
    });
  });

  get fetchingLogs(): boolean {
    return this._fetchingLogs;
  }

  get fetchFailed(): boolean {
    return this._fetchFailed;
  }

  get logs(): Log[] {
    let result = this._sortedLogs;

    if (filtersStore.levels.length > 0) {
      result = result.filter((log) => filtersStore.levels.includes(log.level));
    }

    if (filtersStore.namespaces.length > 0) {
      result = result.filter((log) =>
        filtersStore.namespaces.includes(log.namespace ?? ''),
      );
    }

    if (filtersStore.searchString.trim()) {
      const query = filtersStore.searchString.toLowerCase();
      const queryWords = query.split(' ');
      result = result.filter((log) =>
        queryWords.every((word) => log.message.toLowerCase().includes(word)),
      );
    }

    return result;
  }

  get hasFilters(): boolean {
    return Boolean(
      filtersStore.searchString.trim() ||
        filtersStore.startDate ||
        filtersStore.endDate ||
        filtersStore.levels.length > 0 ||
        filtersStore.namespaces.length > 0,
    );
  }

  get pageIsLoading(): boolean {
    return this._loadingPage;
  }

  get syncPaused(): boolean {
    return logsSyncService.paused;
  }

  get filters(): Partial<LogsFilters> {
    return filtersStore.filters;
  }

  set(logs: Log[]): void {
    untrack(() => {
      if (Object.keys(this._logs).length > 0 || this.shouldFiltersBlockSync) {
        return;
      }

      this._logs = trimLogsObject(arrayToObject(logs, 'id'));
    });
  }

  get shouldFiltersBlockSync(): boolean {
    return Boolean(filtersStore.startDate && filtersStore.endDate);
  }

  get streamPaused(): boolean {
    return (
      this._projectId !== null &&
      (this.shouldFiltersBlockSync || logsSyncService.failed)
    );
  }

  resync(project_id: string): void {
    logger.debug(
      'resyncing logs...',
      filtersStore.searchString.trim(),
      filtersStore.startDate,
      filtersStore.endDate,
      filtersStore.levels,
    );

    if (!this.shouldFiltersBlockSync) {
      this.sync(project_id).catch((error: unknown) => {
        logger.error('failed to sync logs:', error);
      });
      return;
    }

    this.unsync();
    this._projectId = project_id;
    void this.fetchLogs();
  }

  retry(): void {
    if (this._projectId) {
      this.resync(this._projectId);
    }
  }

  async sync(project_id: string): Promise<void> {
    this.unsync();
    this._projectId = project_id;
    logger.debug('syncing logs...', project_id);

    this._logs = {};

    logsSyncService.init({
      projectId: project_id,
      onOpen: () => {
        logger.debug('logs sync connection opened');
      },
      onError: () => {
        logger.error('logs sync connection error');
      },
      onMessage: (log: Log) => {
        namespacesState.addFromLog(log.namespace);

        if (
          filtersStore.levels.length > 0 &&
          !filtersStore.levels.includes(log.level)
        ) {
          return;
        }

        if (
          filtersStore.namespaces.length > 0 &&
          !filtersStore.namespaces.includes(log.namespace ?? '')
        ) {
          return;
        }

        if (filtersStore.searchString.trim()) {
          const queryWords = filtersStore.searchString.toLowerCase().split(' ');
          const messageMatches = queryWords.every((word) =>
            log.message.toLowerCase().includes(word),
          );
          if (!messageMatches) {
            return;
          }
        }

        this._addLog(log);
      },
    });

    await Promise.all([this.fetchLogs(), logsSyncService.open()]);
  }

  async loadNextPage(): Promise<void> {
    const lastLog = this.logs[this.logs.length - 1];

    if (!lastLog || this._loadingPage) {
      return;
    }

    const generation = this._generation;
    this._loadingPage = true;
    await this.fetchLogs({ lastId: lastLog.id });

    if (generation === this._generation) {
      this._loadingPage = false;
    }
  }

  pauseSync(): void {
    logger.debug('pausing logs sync...');
    logsSyncService.close();
  }

  async resumeSync(): Promise<void> {
    if (this.shouldFiltersBlockSync || !this.syncPaused || !this._projectId) {
      logger.debug(
        'not resuming logs sync...',
        this.shouldFiltersBlockSync,
        this.syncPaused,
      );
      return;
    }

    logger.debug('resuming logs sync...');
    await this.sync(this._projectId);
  }

  unsync(): void {
    logger.debug('unsyncing logs...');
    this._generation++;
    this._projectId = null;
    this._fetchingLogs = false;
    this._fetchFailed = false;
    this._loadingPage = false;
    logsSyncService.close();
  }

  private _addLog(log: Log): void {
    const updated = { ...this._logs, [log.id]: log };
    this._logs = trimLogsObject(updated);
  }

  private async fetchLogs(pagination?: { lastId: string }): Promise<void> {
    const projectId = this._projectId;

    if (!projectId) {
      return;
    }

    const generation = this._generation;
    this._fetchingLogs = true;
    this._fetchFailed = false;

    try {
      const logs = await LogsService.getProjectLogs(projectId, {
        ...filtersStore.filters,
        ...(pagination && { lastId: pagination.lastId, direction: 'before' }),
      });

      if (generation !== this._generation) {
        return;
      }

      if (pagination?.lastId) {
        const merged = { ...this._logs, ...arrayToObject<Log>(logs, 'id') };
        this._logs = trimLogsObject(merged);
      } else {
        this._logs = trimLogsObject(arrayToObject<Log>(logs, 'id'));
      }
    } catch (error) {
      logger.error('failed to fetch logs:', error);

      if (generation === this._generation) {
        this._fetchFailed = true;
      }
    } finally {
      if (generation === this._generation) {
        this._fetchingLogs = false;
      }
    }
  }
}

export const logsState = new LogsState();
