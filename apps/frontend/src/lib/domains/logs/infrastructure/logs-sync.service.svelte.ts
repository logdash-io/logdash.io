import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/domains/shared/utils/env-config.js';
import { createLogger } from '$lib/domains/shared/logger';
import { EventSource } from 'eventsource';
import type { Log } from '../domain/log';

const logger = createLogger('logs-sync.service', true);

export class LogsSyncService {
  private _syncConnection: EventSource | null = $state(null);
  private _shouldReconnect = true;
  private _unsubscribe: (() => void) | null = null;
  private _config: {
    projectId: string;
    onOpen?: () => void;
    onError?: () => void;
    onMessage?: (log: Log) => void;
  };
  private _newLogHandlers: ((log: Log) => void)[] = [];

  get paused(): boolean {
    return this._syncConnection === null;
  }

  onLog(handler: (log: Log) => void): () => void {
    this._newLogHandlers.push(handler);

    return () => {
      this._newLogHandlers = this._newLogHandlers.filter(
        (handler) => handler !== handler,
      );
    };
  }

  init(config: {
    projectId: string;
    onOpen?: () => void;
    onError?: () => void;
    onMessage?: (log: Log) => void;
  }): void {
    this._config = config;
  }

  get isConnected(): boolean {
    return (
      this._syncConnection !== null &&
      this._syncConnection.readyState === EventSource.OPEN
    );
  }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._unsubscribe?.();

      this._syncConnection = new EventSource(
        `${envConfig.apiBaseUrl}/projects/${this._config.projectId}/logs/sse`,
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
        logger.debug('SSE connection opened', event);
        this._config.onOpen?.();
        resolve();
      };

      const onError = (event) => {
        logger.error('SSE connection error:', event);
        this._config.onError?.();
        this._unsubscribe?.();

        if (this._shouldReconnect) {
          logger.debug('Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (this._shouldReconnect) {
              this.open().catch((error) => {
                logger.error('Failed to reconnect:', error);
              });
            }
          }, 3000);
        }

        reject(new Error('SSE connection failed'));
      };

      const onMessage = (event) => {
        try {
          logger.info('new SSE message:', event);
          const log = JSON.parse(event.data) as Log;
          this._config.onMessage?.(log);
          this._newLogHandlers.forEach((handler) => handler(log));
          logger.debug('processed log:', log);
        } catch (e) {
          logger.error('sse message error:', e);
        }
      };

      this._syncConnection.addEventListener('open', onOpen, {
        once: true,
      });
      this._syncConnection.addEventListener('error', onError);
      this._syncConnection.addEventListener('message', onMessage);

      this._unsubscribe = () => {
        if (!this._syncConnection) {
          logger.debug('No active SSE connection to unsubscribe from');
          return;
        }

        this._syncConnection.removeEventListener('open', onOpen);
        this._syncConnection.removeEventListener('error', onError);
        this._syncConnection.removeEventListener('message', onMessage);

        logger.debug('Unsubscribing from SSE connection');

        this._syncConnection?.close();
        this._syncConnection = null;
      };
    });
  }

  pause(): void {
    logger.debug('pausing logs sync...');
    this._shouldReconnect = false;
    this._unsubscribe?.();
    this._syncConnection?.close();
    this._syncConnection = null;
  }

  resume(): void {
    logger.debug('resuming logs sync...');
    this._shouldReconnect = true;
    this.open().catch((error) => {
      logger.error('Failed to resume sync:', error);
    });
  }

  close(): void {
    logger.debug('closing logs sync...');
    this._shouldReconnect = false;
    this._unsubscribe?.();
    this._syncConnection?.close();
    this._syncConnection = null;
  }
}

export const logsSyncService = new LogsSyncService();
