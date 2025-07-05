import { createLogger } from '$lib/domains/shared/logger';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import type { Log } from '$lib/domains/logs/domain/log';
import { LogsService } from '../infrastructure/logs.service.js';
import type { LogsQueryFilters } from '../domain/logs-query-filters.js';
import {
  logsSyncService,
  LogsSyncService,
} from '../infrastructure/logs-sync.service.svelte.js';

const logger = createLogger('logs.state', true);

type LogsFilters = Omit<LogsQueryFilters, 'lastId' | 'direction'>;

class LogsState {
  private _loadingPage = $state(false);
  private _projectId: string | null = $state(null);
  private _filters = $state<Partial<LogsFilters>>({
    limit: 50,
    startDate: null,
    endDate: null,
    level: null,
    searchString: '',
  });

  private _logs = $state<Record<Log['id'], Log>>({});

  get logs(): Log[] {
    const allLogs = Object.values(this._logs).sort((a, b) => {
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

    if (!this._filters.searchString.trim()) {
      return allLogs;
    }

    const query = this._filters.searchString.toLowerCase();
    const queryWords = query.split(' ');
    return allLogs.filter((log) =>
      queryWords.every((word) => log.message.toLowerCase().includes(word)),
    );
  }

  get pageIsLoading(): boolean {
    return this._loadingPage;
  }

  get syncPaused(): boolean {
    return logsSyncService.paused;
  }

  set(logs: Log[]): void {
    this._logs = arrayToObject(logs, 'id');
  }

  get filtersPausingSync(): boolean {
    return Boolean(
      this._filters.searchString.trim() ||
        this._filters.startDate ||
        this._filters.endDate,
    );
  }

  setFilters(filters: Partial<LogsFilters>): void {
    this._filters = { ...this._filters, ...filters };

    if (this.filtersPausingSync) {
      this.pauseSync();
    } else {
      this.resumeSync();
    }

    this.fetchLogs();
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
    if (this.filtersPausingSync) {
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
    this._logs[log.id] = log;
  }

  private async fetchLogs(pagination?: { lastId: string }): Promise<void> {
    const logs = await LogsService.getProjectLogs(this._projectId, {
      ...this._filters,
      ...(pagination && { lastId: pagination.lastId, direction: 'before' }),
    });

    if (pagination?.lastId) {
      Object.assign(this._logs, arrayToObject<Log>(logs, 'id'));
    } else {
      this._logs = arrayToObject<Log>(logs, 'id');
    }
  }
}

export const logsState = new LogsState();
