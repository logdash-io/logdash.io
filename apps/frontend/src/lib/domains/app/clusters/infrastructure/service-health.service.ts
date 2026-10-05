import { bucketUptime } from '$lib/domains/app/projects/domain/monitoring/ping-bucket.js';
import { monitoringService } from '$lib/domains/app/projects/infrastructure/monitoring.service.js';
import { LogAnalyticsService } from '$lib/domains/logs/infrastructure/log-analytics.service.js';

const DAY_MS = 86_400_000;

export class ServiceHealthService {
  static async readErrorsLastDay(projectId: string): Promise<number> {
    const now = Date.now();
    const response = await LogAnalyticsService.getProjectLogsAnalytics(
      projectId,
      new Date(now - DAY_MS).toISOString(),
      new Date(now).toISOString(),
      undefined,
      ['error'],
    );

    return response.totalLogs;
  }

  static async readUptimeLastDay(monitorId: string): Promise<number | null> {
    const response = await monitoringService.getPingBuckets(monitorId, '24h');

    return bucketUptime(response.buckets);
  }
}
