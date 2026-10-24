import { browser } from '$app/environment';
import type { LogLevel } from '../domain/log-level.js';

export type FiltersPersistenceData = {
  levels: LogLevel[];
  startDate: string | null;
  endDate: string | null;
  searchString: string;
  namespaces?: string[];
  apps?: string[];
};

const STORAGE_KEY_PREFIX = 'logs-filters';

function getStorageKey(userId: string, clusterId: string): string {
  return `${STORAGE_KEY_PREFIX}-${userId}-${clusterId}`;
}

export class FiltersPersistenceService {
  public saveFilters(
    userId: string,
    clusterId: string,
    filters: FiltersPersistenceData,
  ): void {
    if (!browser) {
      return;
    }

    const key = getStorageKey(userId, clusterId);
    localStorage.setItem(key, JSON.stringify(filters));
  }

  public loadFilters(
    userId: string,
    clusterId: string,
  ): FiltersPersistenceData | null {
    if (!browser) {
      return null;
    }

    const key = getStorageKey(userId, clusterId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as FiltersPersistenceData;
    } catch {
      return null;
    }
  }

  public clearFilters(userId: string, clusterId: string): void {
    if (!browser) {
      return;
    }

    const key = getStorageKey(userId, clusterId);
    localStorage.removeItem(key);
  }
}

export const filtersPersistenceService = new FiltersPersistenceService();
