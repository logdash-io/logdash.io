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
      this._fetchAnalytics(project_id, { silent: true });

      logger.debug('setting up interval');
      interval = setInterval(() => {
        this._fetchAnalytics(project_id, { silent: true });
      }, 60000);
    }, msToNextMinute);

    const cleanupLogListener = logsSyncService.onLog((log: Log) => {
      if (!this._matchesActiveFilters(log)) {
        return;
      }

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
    this._fetchAnalytics(projectId);
  }

  async fetchAnalytics(projectId: string): Promise<void> {
    await this._fetchAnalytics(projectId);
  }

  private async _fetchAnalytics(
    projectId: string,
    options: { silent?: boolean } = {},
  ): Promise<void> {
    const startDate = filtersStore.startDate ?? filtersStore.defaultStartDate;

    if (!startDate) {
      return;
    }

    if (!options.silent) {
      this._isLoading = true;
    }

    try {
      const levels =
        filtersStore.levels.length > 0 ? filtersStore.levels : undefined;
      const namespaces =
        filtersStore.namespaces.length > 0
          ? filtersStore.namespaces
          : undefined;
      const searchString = filtersStore.searchString?.trim()
        ? filtersStore.searchString
        : undefined;

      const data = await LogAnalyticsService.getProjectLogsAnalytics(
        projectId,
        startDate,
        filtersStore.endDate || new Date().toISOString(),
        filtersStore.utcOffsetHours,
        levels,
        namespaces,
        searchString,
      );

      this._analyticsData = data;
      logger.debug('Fetched analytics data:', data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this._error = errorMessage;
      logger.error('Error fetching analytics:', error);
    } finally {
      if (!options.silent) {
        this._isLoading = false;
      }
    }
  }

  clearData(): void {
    this._analyticsData = {
      buckets: [],
      totalLogs: 0,
      bucketSizeMinutes: 0,
    };
    this._error = null;
  }

  private _matchesActiveFilters(log: Log): boolean {
    if (
      filtersStore.levels.length > 0 &&
      !filtersStore.levels.includes(log.level)
    ) {
      return false;
    }

    if (
      filtersStore.namespaces.length > 0 &&
      !filtersStore.namespaces.includes(log.namespace ?? '')
    ) {
      return false;
    }

    if (filtersStore.searchString?.trim()) {
      const queryWords = filtersStore.searchString.toLowerCase().split(' ');
      const messageMatch = queryWords.every((word) =>
        log.message.toLowerCase().includes(word),
      );
      const namespaceMatch =
        log.namespace &&
        queryWords.every((word) => log.namespace!.toLowerCase().includes(word));

      if (!messageMatch && !namespaceMatch) {
        return false;
      }
    }

    return true;
  }
}

export const logAnalyticsState = new LogAnalyticsState();
