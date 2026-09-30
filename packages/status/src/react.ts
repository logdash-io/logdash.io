import { useMemo, useSyncExternalStore } from 'react';
import { createStatusPageStore, type StatusPageOptions, type StatusPageSnapshot } from './index.js';

/**
 * Subscribes a component to a status page. One store per `statusPageId` and `baseUrl`;
 * other option changes after the first render are ignored.
 * Server rendering and hydration use the snapshot built from `initialData`.
 */
export function useStatusPage(statusPageId: string, options: StatusPageOptions = {}): StatusPageSnapshot {
  const [store, serverSnapshot] = useMemo(() => {
    const store = createStatusPageStore(statusPageId, options);
    return [store, store.getSnapshot()] as const;
  }, [statusPageId, options.baseUrl]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverSnapshot);
}
