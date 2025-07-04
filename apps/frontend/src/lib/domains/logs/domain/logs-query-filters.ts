export type LogsQueryFilters = {
  lastId: string;
  direction: 'before' | 'after';
  limit: number;
  startDate: string;
  endDate: string;
  level: 'error' | 'info' | 'warning' | 'http' | 'verbose' | 'debug' | 'silly';
  searchString: string;
};
