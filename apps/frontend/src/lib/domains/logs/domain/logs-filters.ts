import type { LogsQueryFilters } from './logs-query-filters.js';

export type LogsFilters = Omit<LogsQueryFilters, 'lastId' | 'direction'> & {
  utcOffsetHours: number;
};
