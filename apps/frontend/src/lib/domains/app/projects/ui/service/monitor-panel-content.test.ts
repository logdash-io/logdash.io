import { expect, test } from '@playwright/test';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import { MonitorMode } from '../../domain/monitoring/monitor-mode';
import {
  monitorPanelContent,
  type MonitorPanelContent,
} from './monitor-panel-content';

const NOW = Date.parse('2026-01-01T00:01:00Z');

function monitor(changes: Partial<Monitor>): Monitor {
  return {
    id: 'm1',
    name: 'API',
    url: 'https://api.acme.com/health',
    projectId: 'p1',
    notificationChannelsIds: [],
    lastStatusCode: 200,
    lastStatus: 'up',
    mode: MonitorMode.PULL,
    badgeKey: 'k',
    ...changes,
  };
}

function read(
  target: Monitor,
  bucketUptime: number | null = null,
): MonitorPanelContent {
  return monitorPanelContent({
    monitor: target,
    pings: [
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        statusCode: 200,
        responseTimeMs: 90,
      },
      {
        createdAt: '2026-01-01T00:00:30.000Z',
        statusCode: 503,
        responseTimeMs: 40,
      },
    ],
    bucketUptime,
    range: '90d',
    now: NOW,
    loaded: true,
  });
}

test('the eyebrow names what is checked', () => {
  expect(read(monitor({})).eyebrow).toBe('api.acme.com/health');
  expect(read(monitor({})).eyebrowHref).toBe('https://api.acme.com/health');
  expect(
    read(monitor({ name: 'acme.com', url: 'https://acme.com' })).eyebrow,
  ).toBe('Live monitor');
  expect(
    read(monitor({ mode: MonitorMode.PUSH, url: undefined })).eyebrow,
  ).toBe('Heartbeat monitor');
});

test('uptime prefers the bucket history and falls back to the checks', () => {
  expect(read(monitor({}), 99.987).stats[2]).toEqual({
    label: '90-day uptime',
    value: '99.98%',
  });
  expect(read(monitor({})).stats[2]).toEqual({
    label: 'Recent uptime',
    value: '50.00%',
  });
  expect(read(monitor({})).lastCheckLabel).toBe('30 s ago');
});

test('with no checks the footer says whether they loaded', () => {
  const empty = (loaded: boolean, failed: boolean): string =>
    monitorPanelContent({
      monitor: monitor({}),
      pings: [],
      bucketUptime: null,
      range: '90d',
      now: NOW,
      loaded,
      failed,
    }).lastCheckLabel;

  expect(empty(false, false)).toBe('Loading checks');
  expect(empty(true, false)).toBe('Waiting for the first check');
  expect(empty(true, true)).toBe('Could not load checks');
});
