import { createLogger } from '$lib/domains/shared/logger';
import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response';
import { LogAnalyticsService } from '$lib/domains/logs/infrastructure/log-analytics.service';
import { logsSyncService } from '../infrastructure/logs-sync.service.svelte.js';
import type { Log } from '../domain/log.js';
import { filtersStore } from '../infrastructure/filters.store.svelte.js';

const logger = createLogger('log_analytics.state', true);

class LogAnalyticsState {
  private _analyticsData = $state<LogsAnalyticsResponse | null>(null);
  private _isLoading = $state(false);
  private _error = $state<string | null>(null);

  get analyticsData(): LogsAnalyticsResponse | null {
    if (!this._analyticsData) {
      return null;
    }

    if (filtersStore.level) {
      return {
        ...this._analyticsData,
        buckets: this._analyticsData.buckets.map((bucket) => ({
          ...bucket,
          countByLevel: {
            ...Object.keys(bucket.countByLevel).reduce(
              (acc, key) => {
                acc[key] = 0;
                return acc;
              },
              {} as Record<string, number>,
            ),
            [filtersStore.level]: bucket.countByLevel[filtersStore.level] || 0,
          } as Record<
            keyof LogsAnalyticsResponse['buckets'][number]['countByLevel'],
            number
          >,
          countTotal: bucket.countByLevel[filtersStore.level] || 0,
        })),
      };
    }

    return this._analyticsData;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  get error(): string | null {
    return this._error;
  }

  sync(project_id: string): () => void {
    this._fetchAnalytics(project_id);

    const UPDATE_MS_SAFETY_BUFFER = 10;
    const now = new Date();
    const msToNextMinute =
      60000 -
      (now.getSeconds() * 1000 + now.getMilliseconds()) +
      UPDATE_MS_SAFETY_BUFFER;

    let interval: ReturnType<typeof setInterval> | null = null;

    logger.debug('scheduling update in ', msToNextMinute, 'ms');
    const timeout = setTimeout(() => {
      logger.debug('executing scheduler - fetching analytics');
      this._fetchAnalytics(project_id);

      logger.debug('setting up interval');
      interval = setInterval(() => {
        this._fetchAnalytics(project_id);
      }, 60000);
    }, msToNextMinute);

    const cleanupLogListener = logsSyncService.onLog((log: Log) => {
      logger.debug(
        'ANALYTICS: New log received:',
        log,
        $state.snapshot({ ...this._analyticsData.buckets }),
      );
      this._analyticsData.totalLogs++;
      this._analyticsData.buckets[this._analyticsData.buckets.length - 1]
        .countTotal++;
      this._analyticsData.buckets[this._analyticsData.buckets.length - 1]
        .countByLevel[log.level]++;

      logger.debug(
        'ANALYTICS: Updated buckets:',
        $state.snapshot({ ...this._analyticsData.buckets }),
      );
    });

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      cleanupLogListener();
      this.clearData();
    };
  }

  refresh(projectId: string): void {
    this.clearData();
    this._fetchAnalytics(projectId);
  }

  async fetchAnalytics(
    project_id: string,
    start_date: string,
    end_date: string | null,
    utc_offset_hours?: number,
  ): Promise<void> {
    logger.debug('Fetching analytics...', {
      project_id,
      start_date,
      end_date,
      utc_offset_hours,
    });

    this._isLoading = true;
    this.clearData();

    try {
      this._fetchAnalytics(project_id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this._error = errorMessage;
      logger.error('Error fetching analytics:', error);
    } finally {
      this._isLoading = false;
    }
  }

  private async _fetchAnalytics(projectId: string): Promise<void> {
    if (!filtersStore.startDate) {
      return;
    }

    const data = await LogAnalyticsService.getProjectLogsAnalytics(
      projectId,
      filtersStore.startDate,
      filtersStore.endDate || new Date().toISOString(),
      filtersStore.utcOffsetHours,
    );

    this._analyticsData = data;
    logger.debug('Fetched analytics data:', data);
  }

  clearData(): void {
    this._analyticsData = {
      buckets: [],
      totalLogs: 0,
      bucketSizeMinutes: 0,
    };
    this._error = null;
  }
}

export const logAnalyticsState = new LogAnalyticsState();
