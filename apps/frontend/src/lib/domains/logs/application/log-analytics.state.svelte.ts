import { createLogger } from '$lib/domains/shared/logger';
import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response';
import { LogAnalyticsService } from '$lib/domains/logs/infrastructure/log-analytics.service';

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

  async fetchAnalytics(
    project_id: string,
    start_date: string,
    end_date: string,
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
      const data = await LogAnalyticsService.getProjectLogsAnalytics(
        project_id,
        start_date,
        end_date,
        utc_offset_hours,
      );

      this._analyticsData = data;
      logger.debug('Fetched analytics data:', data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this._error = errorMessage;
      logger.error('Error fetching analytics:', error);
    } finally {
      this._isLoading = false;
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
}

export const logAnalyticsState = new LogAnalyticsState();
