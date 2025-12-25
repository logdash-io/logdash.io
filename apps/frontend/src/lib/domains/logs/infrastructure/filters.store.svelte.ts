import type { LogLevel } from '../domain/log-level';
import type { LogsFilters } from '../domain/logs-filters.js';
import { filtersPersistenceService } from './filters-persistence.service.js';

export class FiltersStore {
  private _defaultStartDate: string | null = null;
  private _userId: string | null = null;
  private _projectId: string | null = null;

  searchString = $state<string>('');
  startDate = $state<string | null>(null);
  endDate = $state<string | null>(null);
  levels = $state<LogLevel[]>([]);
  namespaces = $state<string[]>([]);
  limit = $state<number>(50);
  utcOffsetHours = $state<number>(0);

  get defaultStartDate(): string | null {
    return this._defaultStartDate;
  }

  get filters(): LogsFilters {
    return {
      searchString: this.searchString,
      startDate: this.startDate,
      endDate: this.endDate,
      levels: this.levels,
      namespaces: this.namespaces,
      limit: this.limit,
      utcOffsetHours: this.utcOffsetHours,
    };
  }

  initPersistence(userId: string, projectId: string): void {
    this._userId = userId;
    this._projectId = projectId;

    const persisted = filtersPersistenceService.loadFilters(userId, projectId);
    if (persisted) {
      this.levels = persisted.levels || [];
      this.namespaces = persisted.namespaces || [];
      this.startDate = persisted.startDate;
      this.endDate = persisted.endDate;
      this.searchString = persisted.searchString || '';
    }
  }

  private persistFilters(): void {
    if (!this._userId || !this._projectId) {
      return;
    }

    filtersPersistenceService.saveFilters(this._userId, this._projectId, {
      levels: this.levels,
      namespaces: this.namespaces,
      startDate: this.startDate,
      endDate: this.endDate,
      searchString: this.searchString,
    });
  }

  toggleLevel(level: LogLevel): void {
    if (this.levels.includes(level)) {
      this.levels = this.levels.filter((l) => l !== level);
    } else {
      this.levels = [...this.levels, level];
    }
    this.persistFilters();
  }

  setLevels(levels: LogLevel[]): void {
    this.levels = levels;
    this.persistFilters();
  }

  hasLevel(level: LogLevel): boolean {
    return this.levels.includes(level);
  }

  toggleNamespace(namespace: string): void {
    if (this.namespaces.includes(namespace)) {
      this.namespaces = this.namespaces.filter((n) => n !== namespace);
    } else {
      this.namespaces = [...this.namespaces, namespace];
    }
    this.persistFilters();
  }

  setNamespaces(namespaces: string[]): void {
    this.namespaces = namespaces;
    this.persistFilters();
  }

  hasNamespace(namespace: string): boolean {
    return this.namespaces.includes(namespace);
  }

  clearNamespaces(): void {
    this.namespaces = [];
    this.persistFilters();
  }

  setFilters(
    filters: Partial<
      LogsFilters & {
        defaultStartDate: string;
        levels: LogLevel[];
        namespaces: string[];
      }
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
    if (filters.levels !== undefined) {
      this.levels = filters.levels;
    }
    if (filters.namespaces !== undefined) {
      this.namespaces = filters.namespaces;
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
    this.persistFilters();
  }

  reset(): void {
    this.searchString = '';
    this.startDate = this._defaultStartDate;
    this.endDate = null;
    this.levels = [];
    this.namespaces = [];
    this.limit = 50;
    this.utcOffsetHours = 0;
    this.persistFilters();
  }
}

export const filtersStore = new FiltersStore();
