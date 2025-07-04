import { createLogger } from '$lib/domains/shared/logger';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/domains/shared/utils/env-config.js';
import { EventSource } from 'eventsource';
import queryString from 'query-string';
import type { Log } from '$lib/domains/logs/domain/log';
import { LogsService } from '../infrastructure/logs.service.js';

const logger = createLogger('logs.state', true);

// todo: divide api calls responsibility from state
class LogsState {
  private syncConnection: EventSource | null = null;
  private _shouldReconnect = true;
  private _unsubscribe: () => void | null = null;
  private _loadingPage = $state(false);

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

    if (!this._searchQuery.trim()) {
      return allLogs;
    }

    const query = this._searchQuery.toLowerCase();
    return allLogs.filter(
      (log) =>
        log.message.toLowerCase().includes(query) ||
        log.level.toLowerCase().includes(query),
    );
  }

  private _searchQuery = $state<string>('');

  get searchQuery(): string {
    return this._searchQuery;
  }

  private _isSearching = $state<boolean>(false);

  get isSearching(): boolean {
    return this._isSearching;
  }

  get pageIsLoading(): boolean {
    return this._loadingPage;
  }

  get isConnected(): boolean {
    return (
      this.syncConnection !== null &&
      this.syncConnection.readyState === EventSource.OPEN
    );
  }

  set(logs: Log[]): void {
    this._logs = arrayToObject(logs, 'id');
  }

  setSearchQuery(query: string): void {
    const previousQuery = this._searchQuery;
    this._searchQuery = query;
    this._isSearching = query.trim().length > 0;

    if (previousQuery.trim() === '' && query.trim() !== '') {
      this.pauseSync();
    } else if (previousQuery.trim() !== '' && query.trim() === '') {
      this._shouldReconnect = true;
    }
  }

  async refreshLogsWithSearch(
    project_id: string,
    tabId: string,
  ): Promise<void> {
    this._logs = {};
    await this.fetchLogs(project_id);

    if (!this._isSearching && this._shouldReconnect) {
      await this._openLogsStream(project_id, tabId);
    }
  }

  clearSearch(): void {
    this.setSearchQuery('');
  }

  async sync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    logger.debug('syncing logs...', project_id, tabId);
    this._logs = {};
    this._shouldReconnect = true;

    await Promise.all([
      this.fetchLogs(project_id),
      this._openLogsStream(project_id, tabId),
    ]);
  }

  async loadNextPage(project_id: string): Promise<void> {
    const lastLog = this.logs[this.logs.length - 1];

    if (!lastLog || this._loadingPage) {
      return;
    }

    this._loadingPage = true;
    await this.fetchLogs(project_id, lastLog.id);
    this._loadingPage = false;
  }

  pauseSync(): void {
    this._shouldReconnect = false;
    logger.debug('pausing logs...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  async resumeSync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    logger.debug('resuming logs...');
    await this.sync(project_id, tabId);
  }

  unsync(): void {
    this._shouldReconnect = false;
    logger.debug('unsyncing logs...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  sendTestLog(project_id: string): Promise<void> {
    return fetch(`/app/api/projects/${project_id}/logs/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to send test log');
        }

        toast.success('Test log sent successfully.');
      })
      .catch((error) => {
        toast.error('Failed to send test log. Please try again later.');
        logger.error('Failed to send test log:', error);
      });
  }

  private _openLogsStream(project_id: string, tabId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._unsubscribe?.();

      this.syncConnection = new EventSource(
        `${envConfig.apiBaseUrl}/projects/${project_id}/logs/sse?tabId=${tabId}`,
        {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              headers: {
                ...init.headers,
                Authorization: `Bearer ${getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie)}`,
              },
            }),
        },
      );

      const onOpen = (event) => {
        logger.debug('o', event);
        resolve();
      };
      const onError = (event) => {
        logger.error('SSE connection error:', event);

        this._unsubscribe?.();

        if (this._shouldReconnect) {
          logger.debug('Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (this._shouldReconnect) {
              this._openLogsStream(project_id, tabId);
            }
          }, 3000);
        }

        reject(new Error('SSE connection failed'));
      };
      const onMessage = (event) => {
        try {
          logger.info('new SSE message:', event);
          const log = JSON.parse(event.data) as Log;
          this._logs[log.id] = log;

          logger.debug('added log:', log);
        } catch (e) {
          logger.error('sse message error:', e);
        }
      };

      this.syncConnection.addEventListener('open', onOpen, {
        once: true,
      });
      this.syncConnection.addEventListener('error', onError);
      this.syncConnection.addEventListener('message', onMessage);

      this._unsubscribe = () => {
        if (!this.syncConnection) {
          logger.debug('No active SSE connection to unsubscribe from');
          return;
        }

        this.syncConnection.removeEventListener('open', onOpen);
        this.syncConnection.removeEventListener('error', onError);
        this.syncConnection.removeEventListener('message', onMessage);

        logger.debug('Unsubscribing from SSE connection');

        this.syncConnection?.close();
        this.syncConnection = null;
      };
    });
  }

  private async fetchLogs(project_id: string, after?: string): Promise<void> {
    const logs = await LogsService.getProjectLogs(
      project_id,
      50,
      after,
      this._searchQuery.trim(),
    );

    if (after) {
      Object.assign(this._logs, arrayToObject<Log>(logs, 'id'));
    } else {
      this._logs = arrayToObject<Log>(logs, 'id');
    }
  }
}

export const logsState = new LogsState();
