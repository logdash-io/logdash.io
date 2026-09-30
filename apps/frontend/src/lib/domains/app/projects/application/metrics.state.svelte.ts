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

const logger = createLogger('metrics.state', true);

// todo: divide api calls responsibility from state
class MetricsState {
  private _simplifiedMetrics = $state<
    Record<SimplifiedMetric['metricRegisterEntryId'], SimplifiedMetric>
  >({});
  private _metrics = $state<
    Record<
      Metric['metricRegisterEntryId'],
      Partial<Record<MetricGranularity, Record<Metric['date'], Metric>>>
    >
  >({});
  private _initialized = $state(false);
  private _projectId = $state<string | null>(null);
  private syncConnection: EventSource | null = null;
  private _generation = 0;
  private _metricDetailsLoading = $state(false);
  private _metricDetailsFailed = $state(false);
  private _unsubscribe: (() => void) | null = null;

  get simplifiedMetrics(): SimplifiedMetric[] {
    return Object.values(this._simplifiedMetrics);
  }

  get ready(): boolean {
    return this._initialized;
  }

  get metricDetailsLoading(): boolean {
    return this._metricDetailsLoading;
  }

  get metricDetailsFailed(): boolean {
    return this._metricDetailsFailed;
  }

  getById(id: string): SimplifiedMetric | undefined {
    return this._simplifiedMetrics[id];
  }

  metricsByMetricRegisterId(
    metricId: string,
    granularity: MetricGranularity,
  ): Metric[] {
    return Object.values(this._metrics[metricId]?.[granularity] ?? {}) ?? [];
  }

  previewMetric(project_id: string, metric_id: string): void {
    void this.fetchMetricDetails(project_id, metric_id);
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

  get projectId(): string | null {
    return this._projectId;
  }

  set(projectId: string, metrics: SimplifiedMetric[]): void {
    this._projectId = projectId;
    this._simplifiedMetrics = arrayToObject(metrics, 'id');
    this._initialized = true;
  }

  async sync(project_id: string, tabId: string): Promise<void> {
    this.unsync();
    const generation = this._generation;
    this._metrics = {};

    if (project_id !== this._projectId) {
      this._projectId = project_id;
      this._simplifiedMetrics = {};
      this._initialized = false;
    }

    logger.debug(`syncing metrics for project ${project_id}...`);

    void this.fetchMetrics(project_id, generation);
    await this._openMetricsStream(project_id, tabId, generation);
  }

  private _openMetricsStream(
    project_id: string,
    tabId: string,
    generation: number,
  ): Promise<void> {
    return new Promise((resolve) => {
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

      const onOpen = (event: Event): void => {
        logger.debug('o', event);
        resolve();
      };
      const onError = (event: Event): void => {
        logger.error('SSE connection error:', event);

        this._unsubscribe?.();

        logger.debug('Attempting to reconnect in 3 seconds...');
        setTimeout(() => {
          if (generation === this._generation) {
            void this._openMetricsStream(project_id, tabId, generation);
          }
        }, 3000);

        resolve();
      };
      const onMessage = (event: MessageEvent<string>): void => {
        if (generation !== this._generation) {
          return;
        }

        try {
          logger.debug('SSE message:', event);
          const metric = JSON.parse(event.data) as Metric;
          const metricId = metric.metricRegisterEntryId;

          this.store(metric);

          if (metric.granularity !== MetricGranularity.MINUTE) {
            return;
          }

          this.refreshAllTime(metric);

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
        resolve();

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

  pauseSync(): void {
    logger.debug('pausing metrics...');
    this.unsync();
  }

  unsync(): void {
    this._generation += 1;
    logger.debug('unsyncing metrics...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  async delete(projectId: string, metricId: string): Promise<void> {
    const metric = this._simplifiedMetrics[metricId];

    if (this._simplifiedMetrics[metricId]) {
      delete this._simplifiedMetrics[metricId];
    } else {
      logger.warn(`Metric with id ${metricId} does not exist`);
    }

    try {
      const response = await fetch(
        `/app/api/metrics?project_id=${projectId}&metric_id=${metricId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      toast.success(`Deleted metric ${metric.name}`);
      logger.debug(`Deleted metric with id ${metricId}`);
    } catch (error) {
      toast.error(`Failed to delete metric ${metric.name}. Please try again.`);
      logger.error('Error deleting metric:', error);
      this._simplifiedMetrics[metricId] = metric;
    }
  }

  private async fetchMetrics(
    project_id: string,
    generation: number,
  ): Promise<void> {
    const url = `/app/api/projects/${project_id}/metrics`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { data } = (await response.json()) as { data: SimplifiedMetric[] };

      if (generation === this._generation) {
        this.set(project_id, data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }

  private store(metric: Metric): void {
    const { metricRegisterEntryId, granularity, date } = metric;

    this._metrics[metricRegisterEntryId] ??= {};
    this._metrics[metricRegisterEntryId][granularity] ??= {};
    this._metrics[metricRegisterEntryId][granularity][date] = metric;
  }

  private refreshAllTime(metric: Metric): void {
    const allTime =
      this._metrics[metric.metricRegisterEntryId]?.[MetricGranularity.ALL_TIME];

    Object.values(allTime ?? {}).forEach((entry) => {
      entry.value = metric.value;
    });
  }

  private async fetchMetricDetails(
    project_id: string,
    metric_id: string,
  ): Promise<void> {
    this._metricDetailsLoading = true;
    this._metricDetailsFailed = false;
    const url = `/app/api/projects/${project_id}/metrics/details?metric_id=${metric_id}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { data } = (await response.json()) as { data: Metric[] };

      data.forEach((metric) => this.store(metric));
    } catch (error) {
      this._metricDetailsFailed = true;
      console.error('Error fetching metrics:', error);
    } finally {
      this._metricDetailsLoading = false;
    }
  }
}

export const metricsState = new MetricsState();
