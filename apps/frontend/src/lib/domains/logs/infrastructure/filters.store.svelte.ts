import type { LogLevel } from '../domain/log-level';
import type { LogsFilters } from '../domain/logs-filters.js';

export class FiltersStore {
  private _defaultStartDate: string | null = null;

  searchString = $state<string>('');
  startDate = $state<string | null>(null);
  endDate = $state<string | null>(null);
  levels = $state<LogLevel[]>([]);
  limit = $state<number>(50);
  utcOffsetHours = $state<number>(0);

  get level(): LogLevel | null {
    return this.levels.length > 0 ? this.levels[0] : null;
  }

  get filters(): LogsFilters {
    return {
      searchString: this.searchString,
      startDate: this.startDate,
      endDate: this.endDate,
      level: this.level,
      limit: this.limit,
      utcOffsetHours: this.utcOffsetHours,
    };
  }

  toggleLevel(level: LogLevel): void {
    if (this.levels.includes(level)) {
      this.levels = this.levels.filter((l) => l !== level);
    } else {
      this.levels = [...this.levels, level];
    }
  }

  setLevels(levels: LogLevel[]): void {
    this.levels = levels;
  }

  hasLevel(level: LogLevel): boolean {
    return this.levels.includes(level);
  }

  setFilters(
    filters: Partial<
      LogsFilters & { defaultStartDate: string; levels: LogLevel[] }
    >,
  ): void {
    if (filters.searchString !== undefined) {
      this.searchString = filters.searchString;
    }
    if (filters.startDate !== undefined) {
      this.startDate = filters.startDate;
    }
    if (filters.endDate !== undefined) {
      this.endDate = filters.endDate;
    }
    if (filters.level !== undefined) {
      this.levels = filters.level ? [filters.level] : [];
    }
    if (filters.levels !== undefined) {
      this.levels = filters.levels;
    }
    if (filters.limit !== undefined) {
      this.limit = filters.limit;
    }
    if (filters.utcOffsetHours !== undefined) {
      this.utcOffsetHours = filters.utcOffsetHours;
    }
    if (filters.defaultStartDate !== undefined) {
      this._defaultStartDate = filters.defaultStartDate;
    }
  }

  reset(): void {
    this.searchString = '';
    this.startDate = this._defaultStartDate;
    this.endDate = null;
    this.levels = [];
    this.limit = 50;
    this.utcOffsetHours = 0;
  }
}

export const filtersStore = new FiltersStore();
