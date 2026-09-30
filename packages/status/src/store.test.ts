import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { createStatusPageStore, fetchStatusPage, StatusPageError, type StatusPage } from './index.ts';

const page = (updatedAt: string): StatusPage => ({ name: 'Acme', status: 'operational', updatedAt, monitors: [] });
const initialData = page('2026-01-01T00:00:00.000Z');
const fresh = page('2026-01-01T00:01:00.000Z');

let visibility: DocumentVisibilityState | 'prerender' = 'visible';
let fetchMock: ReturnType<typeof mockFetch>;

function mockFetch(respond: () => Promise<Response>) {
  return mock.method(globalThis, 'fetch', respond);
}

function ok(data: StatusPage) {
  return async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => data }) as Response;
}

function failWith(status: number) {
  return async () => ({ ok: false, status, statusText: '' }) as Response;
}

function setVisibility(state: typeof visibility): void {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  visibility = 'visible';
  const fakeDocument = Object.defineProperty(new EventTarget(), 'visibilityState', { get: () => visibility });
  Object.defineProperty(globalThis, 'document', { value: fakeDocument, configurable: true });
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.parse(initialData.updatedAt) });
  fetchMock = mockFetch(ok(fresh));
});

afterEach(() => {
  mock.timers.reset();
  mock.restoreAll();
  Reflect.deleteProperty(globalThis, 'document');
});

test('is seeded from initialData without fetching', () => {
  const store = createStatusPageStore('acme', { initialData });

  const snapshot = store.getSnapshot();
  assert.equal(snapshot.data, initialData);
  assert.equal(snapshot.error, null);
  assert.equal(snapshot.isLoading, false);
  assert.deepEqual(snapshot.lastUpdated, new Date(initialData.updatedAt));
  assert.equal(store.getSnapshot(), snapshot);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('starts loading when there is no initialData', async () => {
  const store = createStatusPageStore('acme');
  assert.deepEqual(store.getSnapshot(), { data: null, error: null, isLoading: true, lastUpdated: null });

  store.subscribe(() => {});
  assert.equal(fetchMock.mock.callCount(), 1);
  await settle();

  assert.equal(store.getSnapshot().data, fresh);
  assert.equal(store.getSnapshot().isLoading, false);
});

test('does not poll outside the browser', () => {
  Reflect.deleteProperty(globalThis, 'document');
  const store = createStatusPageStore('acme');

  store.subscribe(() => {});
  mock.timers.tick(120_000);

  assert.equal(fetchMock.mock.callCount(), 0);
});

test('polls only while subscribed', async () => {
  const store = createStatusPageStore('acme', { initialData, pollInterval: 1_000 });
  const unsubscribe = store.subscribe(() => {});
  assert.equal(fetchMock.mock.callCount(), 0);
  const before = store.getSnapshot();

  mock.timers.tick(1_000);
  assert.equal(fetchMock.mock.callCount(), 1);
  await settle();
  const after = store.getSnapshot();
  assert.notEqual(after, before);
  assert.equal(after.data, fresh);
  assert.deepEqual(after.lastUpdated, new Date(fresh.updatedAt));

  mock.timers.tick(1_000);
  assert.equal(fetchMock.mock.callCount(), 2);
  await settle();

  unsubscribe();
  mock.timers.tick(5_000);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('does not fetch without subscribers and refreshes stale initialData on subscribe', async () => {
  const store = createStatusPageStore('acme', { initialData, pollInterval: 60_000 });
  mock.timers.tick(5 * 60_000);
  assert.equal(fetchMock.mock.callCount(), 0);

  store.subscribe(() => {});
  assert.equal(fetchMock.mock.callCount(), 1);
  await settle();
  assert.equal(store.getSnapshot().data, fresh);

  mock.timers.tick(60_000);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('treats a visibilityState other than hidden as visible', () => {
  visibility = 'prerender';
  const store = createStatusPageStore('acme');

  store.subscribe(() => {});
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('keeps the last good data on error and clears the error on the next success', async () => {
  fetchMock.mock.mockImplementation(failWith(500));
  const store = createStatusPageStore('acme', { initialData, pollInterval: 1_000 });
  store.subscribe(() => {});

  mock.timers.tick(1_000);
  await settle();
  const failed = store.getSnapshot();
  assert.equal(failed.data, initialData);
  assert.ok(failed.error instanceof StatusPageError);
  assert.equal(failed.error.status, 500);
  assert.equal(failed.isLoading, false);
  assert.deepEqual(failed.lastUpdated, new Date(initialData.updatedAt));

  fetchMock.mock.mockImplementation(ok(fresh));
  mock.timers.tick(1_000);
  await settle();
  assert.equal(store.getSnapshot().data, fresh);
  assert.equal(store.getSnapshot().error, null);
});

test('pauses while the tab is hidden and refetches on return', async () => {
  const store = createStatusPageStore('acme', { initialData, pollInterval: 1_000 });
  store.subscribe(() => {});

  setVisibility('hidden');
  mock.timers.tick(10_000);
  assert.equal(fetchMock.mock.callCount(), 0);

  setVisibility('visible');
  assert.equal(fetchMock.mock.callCount(), 1);
  await settle();
  assert.equal(store.getSnapshot().data, fresh);

  mock.timers.tick(1_000);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('fetchStatusPage throws StatusPageError with the status for 403 and 404', async () => {
  for (const status of [403, 404]) {
    fetchMock.mock.mockImplementation(failWith(status));
    await assert.rejects(fetchStatusPage('acme'), (error) => error instanceof StatusPageError && error.status === status);
  }
});

test('fetchStatusPage lets network errors through as they are', async () => {
  const networkError = new TypeError('fetch failed');
  fetchMock.mock.mockImplementation(() => Promise.reject(networkError));

  await assert.rejects(fetchStatusPage('acme'), (error) => error === networkError && !(error instanceof StatusPageError));
});

test('fetchStatusPage encodes the id and joins the base URL', async () => {
  await fetchStatusPage('status.acme.com/x', { baseUrl: 'http://localhost:3000/' });

  assert.equal(fetchMock.mock.calls[0].arguments[0], 'http://localhost:3000/v1/status_pages/status.acme.com%2Fx');
});

test('a pollInterval of 0 or Infinity does not poll, not even when the tab becomes visible', async () => {
  for (const pollInterval of [0, Infinity]) {
    const store = createStatusPageStore('acme', { initialData, pollInterval });
    const unsubscribe = store.subscribe(() => {});
    mock.timers.tick(120_000);
    setVisibility('hidden');
    setVisibility('visible');
    await settle();
    unsubscribe();
  }

  assert.equal(fetchMock.mock.callCount(), 0);
});
