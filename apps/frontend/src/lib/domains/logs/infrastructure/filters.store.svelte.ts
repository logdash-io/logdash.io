import type { LogsFilters } from '../domain/logs-filters.js';

export class FiltersStore {
  private _defaultStartDate: string | null = null;

  searchString = $state<string>('');
  startDate = $state<string | null>(null);
  endDate = $state<string | null>(null);
  level = $state<
    'error' | 'info' | 'warning' | 'http' | 'verbose' | 'debug' | 'silly' | null
  >(null);
  limit = $state<number>(50);
  utcOffsetHours = $state<number>(0);

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

  setFilters(
    filters: Partial<LogsFilters & { defaultStartDate: string }>,
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
      this.level = filters.level;
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
    this.level = null;
    this.limit = 50;
    this.utcOffsetHours = 0;
  }
}

export const filtersStore = new FiltersStore();
