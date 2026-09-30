import { expect, test } from '@playwright/test';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import type { Log } from '$lib/domains/logs/domain/log';
import {
  heroLive,
  heroLogRows,
  heroMetrics,
  heroReading,
  heroService,
} from './hero-dashboard';

const NOW = Date.parse('2026-01-01T00:01:00Z');

function ping(second: number, statusCode = 200): HttpPing {
  return {
    createdAt: new Date(NOW - (60 - second) * 1_000),
    statusCode,
    responseTimeMs: 100 + second,
  } as HttpPing;
}

const demo = {
  monitor: { name: 'api.logdash.io' } as never,
  pings: [ping(45), ping(30), ping(15)],
};

test('the live indicator names every phase', () => {
  expect(heroLive('creating')).toEqual({
    label: 'Starting',
    dot: 'neutral',
    pending: true,
  });
  expect(heroLive('idle').label).toBe('Live');
  expect(heroLive('previewing').dot).toBe('success');
  expect(heroLive('ended')).toMatchObject({ label: 'Expired', dot: 'neutral' });
  expect(heroLive('error')).toMatchObject({ label: 'Stopped', dot: 'error' });
});

test('the service row follows the demo until the visitor has a preview', () => {
  const base = {
    previewHost: 'example.com',
    hasPreview: true,
    pings: [],
    demo,
  };

  expect(heroService({ ...base, phase: 'idle' })).toEqual({
    name: 'api.logdash.io',
    status: 'up',
    pending: false,
  });
  expect(heroService({ ...base, phase: 'creating' })).toEqual({
    name: 'example.com',
    status: 'unknown',
    pending: true,
  });
  expect(
    heroService({ ...base, phase: 'previewing', pings: [ping(50, 0)] }),
  ).toMatchObject({ name: 'example.com', status: 'down' });
  expect(heroService({ ...base, phase: 'error', hasPreview: false }).name).toBe(
    'api.logdash.io',
  );
});

test('a reading sorts pings and reports the latest one', () => {
  const reading = heroReading(demo.pings, NOW, 'Waiting');

  expect(reading.stats.map((stat) => stat.value)).toEqual([
    '145 ms',
    '200',
    '100%',
  ]);
  expect(reading.checkingLabel).toBe('Checking every 15 s');
  expect(reading.lastCheckLabel).toBe('15 s ago');
  expect(heroReading([], NOW, 'Waiting').lastCheckLabel).toBe('Waiting');
});

test('log rows keep a stable numeric key and metrics end on their value', () => {
  const log = {
    id: '6abb1a69d1593e90809c2685',
    message: 'hi',
    level: 'info',
    createdAt: new Date(NOW),
  } as Log;

  expect(heroLogRows([log])[0].key).toBe(0x3e90809c2685);
  expect(
    heroMetrics([
      {
        id: 'm',
        metricRegisterEntryId: 'r',
        name: 'pings',
        value: 3,
        history: [1, 2],
      },
    ])[0].samples,
  ).toEqual([1, 2, 3]);
});
