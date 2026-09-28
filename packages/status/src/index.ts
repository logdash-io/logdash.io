import type { components } from './api.generated.js';

type Schemas = components['schemas'];

export type StatusPage = Schemas['StatusPageDto'];
export type Monitor = Schemas['StatusPageMonitorDto'];
export type Bucket = Schemas['StatusPageBucketDto'];
export type Ping = Schemas['StatusPagePingDto'];

export type StatusPageOptions = {
  baseUrl?: string;
  pollInterval?: number;
  initialData?: StatusPage;
};

export type StatusPageSnapshot = {
  data: StatusPage | null;
  error: Error | null;
  isLoading: boolean;
  lastUpdated: Date | null;
};

const DEFAULT_BASE_URL = 'https://api.logdash.io';

/** Thrown when the API answers with an error status: 404 unknown page, 403 page not public. */
export class StatusPageError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'StatusPageError';
    this.status = status;
  }
}

/**
 * Fetches a public status page by its id or verified custom domain.
 * `init` is passed through to `fetch`, e.g. `{ next: { revalidate: 60 } }` or `{ signal }`.
 * Network failures reject with the error `fetch` throws, not a `StatusPageError`.
 */
export async function fetchStatusPage(
  statusPageId: string,
  options: { baseUrl?: string; init?: RequestInit } = {},
): Promise<StatusPage> {
  const { baseUrl = DEFAULT_BASE_URL, init } = options;
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/status_pages/${encodeURIComponent(statusPageId)}`;
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new StatusPageError(
      response.status,
      `Failed to fetch status page "${statusPageId}": ${response.status} ${response.statusText}`.trim(),
    );
  }

  return response.json();
}

/**
 * A subscribable status page, seeded from `initialData`.
 * Polls only while it has subscribers and only in the browser, pauses while the tab is hidden
 * and refetches when it becomes visible again. A failed fetch keeps the last good data and sets `error`.
 * The snapshot is a new object on every change and the same object otherwise.
 */
export function createStatusPageStore(
  statusPageId: string,
  options: StatusPageOptions = {},
): {
  subscribe(listener: () => void): () => void;
  getSnapshot(): StatusPageSnapshot;
  refresh(): Promise<void>;
} {
  const { baseUrl, pollInterval = 60_000, initialData } = options;
  const listeners = new Set<() => void>();
  let snapshot: StatusPageSnapshot = {
    data: initialData ?? null,
    error: null,
    isLoading: !initialData,
    lastUpdated: initialData ? new Date(initialData.updatedAt) : null,
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<void> | undefined;

  function set(patch: Partial<StatusPageSnapshot>): void {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  }

  // 0, Infinity and anything above setTimeout's 32-bit limit would fire immediately and poll in a tight loop.
  const canPoll = pollInterval > 0 && pollInterval < 2 ** 31;

  function isPolling(): boolean {
    return listeners.size > 0 && typeof document !== 'undefined' && document.visibilityState !== 'hidden';
  }

  // initialData can be much older than pollInterval, for example a statically generated page served
  // stale while it revalidates, so it is refreshed on subscribe instead of after a full interval.
  function isStale(): boolean {
    if (!snapshot.lastUpdated) return true;
    return canPoll && Date.now() - snapshot.lastUpdated.getTime() >= pollInterval;
  }

  function schedule(): void {
    clearTimeout(timer);
    if (isPolling() && canPoll) timer = setTimeout(refresh, pollInterval);
  }

  function onVisibilityChange(): void {
    // With polling off, only a store without data fetches when the tab becomes visible.
    if (isPolling() && (canPoll || !snapshot.data)) void refresh();
    else clearTimeout(timer);
  }

  async function load(): Promise<void> {
    clearTimeout(timer);
    if (!snapshot.isLoading) set({ isLoading: true });

    try {
      const data = await fetchStatusPage(statusPageId, { baseUrl });
      set({ data, error: null, isLoading: false, lastUpdated: new Date(data.updatedAt) });
    } catch (error) {
      set({ error: error instanceof Error ? error : new Error(String(error)), isLoading: false });
    }

    inFlight = undefined;
    schedule();
  }

  function refresh(): Promise<void> {
    inFlight ??= load();
    return inFlight;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      if (listeners.size === 1 && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange);
        if (isPolling() && isStale()) void refresh();
        else schedule();
      }

      return () => {
        if (!listeners.delete(listener) || listeners.size > 0) return;
        clearTimeout(timer);
        if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    },
    getSnapshot: () => snapshot,
    refresh,
  };
}
