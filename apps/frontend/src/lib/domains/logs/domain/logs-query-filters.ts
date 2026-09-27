import type { LogLevel } from './log-level';

export type LogsQueryFilters = {
  lastId: string;
  direction: 'before' | 'after';
  limit: number;
  startDate: string | null;
  endDate: string | null;
  levels: LogLevel[];
  searchString: string;
  namespaces: string[];
};
