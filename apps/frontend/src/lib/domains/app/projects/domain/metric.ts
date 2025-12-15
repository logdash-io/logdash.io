export enum MetricGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  ALL_TIME = 'all-time',
}

export type SimplifiedMetric = {
  id: string;
  metricRegisterEntryId: string;
  name: string;
  value: number;
};

export type Metric = {
  id: string;
  metricRegisterEntryId: string;
  granularity: MetricGranularity;
  date: string;
  name: string;
  value: number;
};

export type MetricDataPoint = {
  date: string;
  value: number;
};
