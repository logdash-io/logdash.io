export type PublicDashboardData = {
  httpMonitors: {
    name: string;
    buckets: ({
      timestamp: string; // ISO 8601 format
      successCount: number;
      failureCount: number;
      averageLatencyMs: number;
    } | null)[]; // Buckets can be null for time periods with no data
    pings: {
      createdAt: string; // ISO 8601 format
      statusCode: number;
      responseTimeMs: number;
    }[];
  }[];
};
