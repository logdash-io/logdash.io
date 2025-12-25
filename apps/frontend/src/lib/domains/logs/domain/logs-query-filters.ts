import type { LogLevel } from './log-level';

export type LogsQueryFilters = {
  lastId: string;
  direction: 'before' | 'after';
  limit: number;
  startDate: string;
  endDate: string;
  level: LogLevel;
  levels: LogLevel[];
  searchString: string;
};
