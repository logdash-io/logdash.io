// PROVISIONAL: hand-written from the v1 contract in .context/plans/headless-status-pages.md.
// Replaced by `openapi-typescript` output from apps/backend/openapi/status-page-v1.json.
export interface components {
  schemas: {
    StatusPageBucketDto: {
      timestamp: string;
      successCount: number;
      failureCount: number;
      averageLatencyMs: number | null;
    };
    StatusPagePingDto: {
      createdAt: string;
      statusCode: number;
      responseTimeMs: number;
    };
    StatusPageUptimeDto: {
      '1h': number | null;
      '24h': number | null;
      '7d': number | null;
      '30d': number | null;
      '90d': number | null;
    };
    StatusPageHistoryDto: {
      daily: components['schemas']['StatusPageBucketDto'][];
    };
    StatusPageMonitorDto: {
      id: string;
      name: string;
      /** @enum {string} */
      status: 'up' | 'degraded' | 'down' | 'unknown';
      uptime: components['schemas']['StatusPageUptimeDto'];
      history: components['schemas']['StatusPageHistoryDto'];
      pings: components['schemas']['StatusPagePingDto'][];
    };
    StatusPageDto: {
      name: string;
      /** @enum {string} */
      status: 'operational' | 'degraded' | 'outage' | 'unknown';
      updatedAt: string;
      monitors: components['schemas']['StatusPageMonitorDto'][];
    };
  };
}
