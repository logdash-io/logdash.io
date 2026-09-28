import { createSubscriber } from 'svelte/reactivity';
import { createStatusPageStore, type StatusPage, type StatusPageOptions } from './index.js';

/**
 * Reactive status page for Svelte 5. Reading a property inside an effect or template subscribes;
 * the store stops polling once nothing reads it. Wrap in `$derived` when the id can change.
 */
export function statusPage(
  statusPageId: string,
  options?: StatusPageOptions,
): {
  readonly data: StatusPage | null;
  readonly error: Error | null;
  readonly isLoading: boolean;
  readonly lastUpdated: Date | null;
  refresh(): Promise<void>;
} {
  const store = createStatusPageStore(statusPageId, options);
  const subscribe = createSubscriber((update) => store.subscribe(update));
  const read = () => {
    subscribe();
    return store.getSnapshot();
  };

  return {
    get data() {
      return read().data;
    },
    get error() {
      return read().error;
    },
    get isLoading() {
      return read().isLoading;
    },
    get lastUpdated() {
      return read().lastUpdated;
    },
    refresh: store.refresh,
  };
}
