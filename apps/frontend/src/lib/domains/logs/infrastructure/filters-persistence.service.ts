import { browser } from '$app/environment';
import type { LogLevel } from '../domain/log-level.js';

export type FiltersPersistenceData = {
  levels: LogLevel[];
  startDate: string | null;
  endDate: string | null;
  searchString: string;
};

const STORAGE_KEY_PREFIX = 'logs-filters';

function getStorageKey(userId: string, projectId: string): string {
  return `${STORAGE_KEY_PREFIX}-${userId}-${projectId}`;
}

export class FiltersPersistenceService {
  public saveFilters(
    userId: string,
    projectId: string,
    filters: FiltersPersistenceData,
  ): void {
    if (!browser) {
      return;
    }

    const key = getStorageKey(userId, projectId);
    localStorage.setItem(key, JSON.stringify(filters));
  }

  public loadFilters(
    userId: string,
    projectId: string,
  ): FiltersPersistenceData | null {
    if (!browser) {
      return null;
    }

    const key = getStorageKey(userId, projectId);
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

  public clearFilters(userId: string, projectId: string): void {
    if (!browser) {
      return;
    }

    const key = getStorageKey(userId, projectId);
    localStorage.removeItem(key);
  }
}

export const filtersPersistenceService = new FiltersPersistenceService();
