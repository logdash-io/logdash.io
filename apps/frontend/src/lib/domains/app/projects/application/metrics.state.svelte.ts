import { createLogger } from '$lib/domains/shared/logger';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/domains/shared/utils/env-config.js';
import { EventSource } from 'eventsource';
import {
  MetricGranularity,
  type Metric,
  type SimplifiedMetric,
} from '$lib/domains/app/projects/domain/metric';
import {
  FAKE_METRICS,
  generateFakeMinuteData,
  generateFakeHourData,
  generateFakeDayData,
} from '$lib/domains/app/projects/domain/fake-metrics-data.js';

const logger = createLogger('metrics.state', true);

// todo: divide api calls responsibility from state
class MetricsState {
  private _simplifiedMetrics = $state<
    Record<SimplifiedMetric['metricRegisterEntryId'], SimplifiedMetric>
  >({});
  private _metrics = $state<
    Record<
      Metric['metricRegisterEntryId'],
      Record<MetricGranularity, Record<Metric['date'], Metric>>
    >
  >({});
  private _initialized = $state(false);
  private syncConnection: EventSource | null = null;
  private _shouldReconnect = true;
  private _metricDetailsLoading = $state(false);
  private _unsubscribe: () => void | null = null;

  get simplifiedMetrics(): SimplifiedMetric[] {
    return Object.values(this._simplifiedMetrics);
  }

  get displayMetrics(): SimplifiedMetric[] {
    const realMetrics = this.simplifiedMetrics;
    return realMetrics.length > 0 ? realMetrics : FAKE_METRICS;
  }

  get isUsingFakeData(): boolean {
    return this.simplifiedMetrics.length === 0;
  }

  get ready(): boolean {
    return this._initialized;
  }

  get metricDetailsLoading(): boolean {
    return this._metricDetailsLoading;
  }

  getById(id: string): SimplifiedMetric | undefined {
    const real = this._simplifiedMetrics[id];
    if (real) return real;
    return FAKE_METRICS.find((m) => m.id === id);
  }

  getFakeChartData(granularity: MetricGranularity): { x: string; y: number }[] {
    switch (granularity) {
      case MetricGranularity.MINUTE:
        return generateFakeMinuteData();
      case MetricGranularity.HOUR:
        return generateFakeHourData();
      case MetricGranularity.DAY:
        return generateFakeDayData();
      default:
        return [];
    }
  }

  metricsByMetricRegisterId(
    metricId: string,
    granularity: MetricGranularity,
  ): Metric[] {
    return Object.values(this._metrics[metricId]?.[granularity] ?? {}) ?? [];
  }

  previewMetric(project_id: string, metric_id: string): void {
    this.fetchMetricDetails(project_id, metric_id);
  }

  getLastPreviewedMetricId(projectId: string): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage.getItem(`metrics:lastPreviewed:${projectId}`);
  }

  setLastPreviewedMetricId(projectId: string, metricId: string): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.setItem(`metrics:lastPreviewed:${projectId}`, metricId);
  }

  set(metrics: SimplifiedMetric[]): void {
    this._simplifiedMetrics = arrayToObject(metrics, 'id');
    this._initialized = true;
  }

  async sync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    this._metrics = {};
    this._shouldReconnect = true;

    logger.debug(`syncing metrics for project ${project_id}...`);

    await Promise.all([
      this.fetchMetrics(project_id),
      this._openMetricsStream(project_id, tabId),
    ]);
  }

  private _openMetricsStream(project_id: string, tabId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._unsubscribe?.();

      this.syncConnection = new EventSource(
        `${envConfig.apiBaseUrl}/projects/${project_id}/metrics/sse?tab_id=${tabId}`,
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
              this._openMetricsStream(project_id, tabId);
            }
          }, 3000);
        }

        reject(new Error('SSE connection failed'));
      };
      const onMessage = (event) => {
        try {
          logger.debug('SSE message:', event);
          const metric: Metric = JSON.parse(event.data);
          const metricId = metric.metricRegisterEntryId;

          this._metrics[metricId] = (this._metrics[metricId] as never) || {};

          if (!this._metrics[metricId]) {
            this._metrics[metricId][metric.granularity][metric.date] = metric;
            logger.debug(
              `added metric ${metric.name} with the value ${metric.value}`,
            );
          } else if (!this._metrics[metricId][metric.granularity]) {
            this._metrics[metricId][metric.granularity] = {
              [metric.date]: metric,
            };
            logger.debug(
              `added metric ${metric.name} with the value ${metric.value}`,
            );
          } else if (
            !this._metrics[metricId][metric.granularity][metric.date]
          ) {
            this._metrics[metricId][metric.granularity][metric.date] = metric;
            logger.debug(
              `added metric ${metric.name} with the value ${metric.value}`,
            );
          }

          if (metric.granularity !== MetricGranularity.MINUTE) {
            return;
          }

          if (!this._simplifiedMetrics[metricId]) {
            this._simplifiedMetrics[metricId] = {
              metricRegisterEntryId: metric.metricRegisterEntryId,
              id: metricId,
              name: metric.name,
              value: metric.value,
            };
            logger.debug(
              `added all time metric ${metric.name} with the value ${metric.value}`,
            );
          } else {
            this._simplifiedMetrics[metricId].value = metric.value;
            logger.debug(
              `updated all time metric ${metric.name} with the value ${metric.value}`,
            );
          }
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

  async resumeSync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    logger.debug('resuming metrics...');
    await this.sync(project_id, tabId);
  }

  async pauseSync(): Promise<void> {
    this._shouldReconnect = false;
    logger.debug('pausing metrics...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  unsync(): void {
    this._shouldReconnect = false;
    logger.debug('unsyncing metrics...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  delete(projectId: string, metricId: string): void {
    const metric = this._simplifiedMetrics[metricId];

    if (this._simplifiedMetrics[metricId]) {
      delete this._simplifiedMetrics[metricId];
    } else {
      logger.warn(`Metric with id ${metricId} does not exist`);
    }

    fetch(`/app/api/metrics?project_id=${projectId}&metric_id=${metricId}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(() => {
        toast.success(`Deleted metric ${metric.name}`);
        logger.debug(`Deleted metric with id ${metricId}`);
      })
      .catch((error) => {
        toast.error(
          `Failed to delete metric ${metric.name}. Please try again.`,
        );
        logger.error('Error deleting metric:', error);
        this._simplifiedMetrics[metricId] = metric;
      });
  }

  private fetchMetrics(project_id: string): void {
    const url = `/app/api/projects/${project_id}/metrics`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(async ({ data }) => {
        this._simplifiedMetrics = arrayToObject(data, 'id');
        this._initialized = true;
      })
      .catch((error) => {
        console.error('Error fetching metrics:', error);
      });
  }

  private async fetchMetricDetails(
    project_id: string,
    metric_id: string,
  ): Promise<void> {
    this._metricDetailsLoading = true;
    const url = `/app/api/projects/${project_id}/metrics/details?metric_id=${metric_id}`;

    await fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(({ data }: { data: Metric[] }) => {
        data.forEach((metric) => {
          const metricId = metric.metricRegisterEntryId;
          this._metrics[metricId] = (this._metrics[metricId] as never) || {};
          this._metrics[metricId][metric.granularity] =
            this._metrics[metricId][metric.granularity] || {};

          this._metrics[metricId][metric.granularity][metric.date] = metric;
        });
      })
      .catch((error) => {
        console.error('Error fetching metrics:', error);
      })
      .finally(() => {
        this._metricDetailsLoading = false;
      });
  }
}

export const metricsState = new MetricsState();
