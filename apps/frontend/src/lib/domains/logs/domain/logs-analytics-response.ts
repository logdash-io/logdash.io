export type LogsAnalyticsResponse = {
  buckets: Array<{
    bucketStart: string;
    bucketEnd: string;
    countByLevel: {
      info: number;
      warning: number;
      error: number;
      http: number;
      verbose: number;
      debug: number;
      silly: number;
    };
    countTotal: number;
  }>;
  totalLogs: number;
  bucketSizeMinutes: number;
};
