import type { Log } from '$lib/domains/logs/domain/log';
import { createLogger } from '$lib/domains/shared/logger';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import type { LogsFilters } from '../domain/logs-filters.js';
import { filtersStore } from '../infrastructure/filters.store.svelte.js';
import { logsSyncService } from '../infrastructure/logs-sync.service.svelte.js';
import { LogsService } from '../infrastructure/logs.service.js';

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
  private _projectId: string | null = $state(null);
  private _initialized = false;

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

  get logs(): Log[] {
    let result = this._sortedLogs;

    if (filtersStore.levels.length > 0) {
      result = result.filter((log) => filtersStore.levels.includes(log.level));
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
        filtersStore.levels.length > 0,
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
    this._logs = trimLogsObject(arrayToObject(logs, 'id'));
  }

  get shouldFiltersBlockSync(): boolean {
    return Boolean(filtersStore.startDate && filtersStore.endDate);
  }

  resync(project_id: string, skipFetch: boolean = false): void {
    this._projectId = project_id;
    logger.debug(
      'resyncing logs...',
      filtersStore.searchString.trim(),
      filtersStore.startDate,
      filtersStore.endDate,
      filtersStore.levels,
    );

    if (this.shouldFiltersBlockSync) {
      if (!skipFetch) {
        this.fetchLogs();
      }
      this.pauseSync();
    } else {
      this.resumeSync();
    }
  }

  async sync(project_id: string): Promise<void> {
    this._projectId = project_id;
    this.unsync();
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
        if (
          filtersStore.levels.length > 0 &&
          !filtersStore.levels.includes(log.level)
        ) {
          return;
        }

        this._addLog(log);
      },
    });

    this._initialized = true;

    await Promise.all([this.fetchLogs(), logsSyncService.open()]);
  }

  async loadNextPage(): Promise<void> {
    const lastLog = this.logs[this.logs.length - 1];

    if (!lastLog || this._loadingPage) {
      return;
    }

    this._loadingPage = true;
    try {
      await this.fetchLogs({ lastId: lastLog.id });
    } finally {
      this._loadingPage = false;
    }
  }

  pauseSync(): void {
    logger.debug('pausing logs sync...');
    logsSyncService.pause();
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
    logsSyncService.close();
  }

  async sendTestLog(project_id: string): Promise<void> {
    await LogsService.sendTestLog(project_id)
      .then(() => toast.success('Test log sent successfully.'))
      .catch((error) => {
        toast.error('Failed to send test log. Please try again later.');
        logger.error('Failed to send test log:', error);
      });
  }

  private _addLog(log: Log): void {
    const updated = { ...this._logs, [log.id]: log };
    this._logs = trimLogsObject(updated);
  }

  private async fetchLogs(pagination?: { lastId: string }): Promise<void> {
    this._fetchingLogs = true;

    try {
      const logs = await LogsService.getProjectLogs(this._projectId, {
        ...filtersStore.filters,
        ...(pagination && { lastId: pagination.lastId, direction: 'before' }),
      });

      if (pagination?.lastId) {
        const merged = { ...this._logs, ...arrayToObject<Log>(logs, 'id') };
        this._logs = trimLogsObject(merged);
      } else {
        this._logs = trimLogsObject(arrayToObject<Log>(logs, 'id'));
      }
    } finally {
      this._fetchingLogs = false;
    }
  }
}

export const logsState = new LogsState();
