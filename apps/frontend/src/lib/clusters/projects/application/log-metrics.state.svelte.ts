import { createLogger } from '$lib/shared/logger';
import { arrayToObject } from '$lib/shared/utils/array-to-object';
import { getCookieValue } from '$lib/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/shared/utils/env-config.js';
import { EventSource } from 'eventsource';
import type { LogGranularity } from '../domain/log-granularity';
import type { LogMetric } from '../domain/log-metric';

type GranularLogMetrics = Record<
  LogGranularity,
  Record<LogMetric['date'], LogMetric>
>;

const logger = createLogger('log_metrics.state', true);

// todo: divide api calls responsibility from state
class LogMetricsState {
  private _logMetrics = $state<GranularLogMetrics>({
    day: {},
    hour: {},
    minute: {},
  });
  private syncConnection: EventSource | null = null;
  private _shouldReconnect = true;
  private _unsubscribe: () => void | null = null;

  get logMetrics(): Record<LogGranularity, LogMetric[]> {
    return {
      day: Object.values(this._logMetrics.day),
      hour: Object.values(this._logMetrics.hour),
      minute: Object.values(this._logMetrics.minute),
    };
  }

  async sync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    logger.debug('syncing...', project_id, tabId);
    this._logMetrics = {
      day: {},
      hour: {},
      minute: {},
    };
    this._shouldReconnect = true;

    await Promise.all([
      this.fetchLogMetrics(project_id),
      this._openLogMetricsStream(project_id, tabId),
    ]);
  }

  private _openLogMetricsStream(
    project_id: string,
    tabId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._unsubscribe?.();

      this.syncConnection = new EventSource(
        `${envConfig.apiBaseUrl}/projects/${project_id}/log_metrics/sse?tab_id=${tabId}`,
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
              this._openLogMetricsStream(project_id, tabId);
            }
          }, 3000);
        }

        reject(new Error('SSE connection failed'));
      };
      const onMessage = (event) => {
        try {
          const logMetric = JSON.parse(event.data);
          // Determine which granularity this metric belongs to
          const granularity =
            (logMetric.granularity as LogGranularity) || 'minute';

          if (this._logMetrics[granularity][logMetric.date]) {
            this._logMetrics[granularity][logMetric.date] = {
              ...this._logMetrics[granularity][logMetric.date],
              ...logMetric,
              values: Object.entries(logMetric.values || {}).reduce(
                (acc, [key, value]) => {
                  acc[key] = acc[key] + value;
                  return acc;
                },
                {
                  // todo: add rest of the keys
                  warning: 0,
                  error: 0,
                  info: 0,
                  ...this._logMetrics[granularity][logMetric.date].values,
                },
              ),
            };
          } else {
            this._logMetrics[granularity][logMetric.date] = logMetric;
          }
        } catch (e) {
          logger.error('error parsing message:', e);
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

  pauseSync(): void {
    this._shouldReconnect = false;
    logger.debug('pausing sync...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  async resumeSync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    logger.debug('resuming sync...');
    await this.sync(project_id, tabId);
  }

  unsync(): void {
    this._shouldReconnect = false;
    logger.debug('unsyncing...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  private async fetchLogMetrics(project_id: string): Promise<void> {
    const response = await fetch(`/app/api/projects/${project_id}/log-metrics`);
    const {
      data,
    }: {
      data: {
        day: LogMetric[];
        hour: LogMetric[];
        minute: LogMetric[];
      };
    } = await response.json();

    // Convert arrays to objects indexed by date for each granularity
    this._logMetrics = {
      day: arrayToObject<LogMetric>(data.day || [], 'date'),
      hour: arrayToObject<LogMetric>(data.hour || [], 'date'),
      minute: arrayToObject<LogMetric>(data.minute || [], 'date'),
    };

    logger.debug('Fetched log metrics:', this._logMetrics);
  }
}

export const logMetricsState = new LogMetricsState();
