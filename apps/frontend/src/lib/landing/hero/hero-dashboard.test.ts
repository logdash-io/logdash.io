import { expect, test } from '@playwright/test';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import { demoName, heroLive, heroMonitor, heroReading } from './hero-dashboard';

const NOW = Date.parse('2026-01-01T00:01:00Z');

function ping(second: number, statusCode = 200): HttpPing {
  return {
    createdAt: new Date(NOW - (60 - second) * 1_000),
    statusCode,
    responseTimeMs: 100 + second,
  } as HttpPing;
}

const demo = {
  monitor: { name: 'api.logdash.io', url: 'https://api.logdash.io' } as never,
  pings: [ping(45), ping(30), ping(15)],
  loaded: true,
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

test('the monitor follows the demo until the visitor has a preview', () => {
  const base = {
    previewHost: 'example.com',
    previewUrl: 'https://example.com',
    hasPreview: true,
    pings: [],
    demo,
  };

  expect(heroMonitor({ ...base, phase: 'idle' })).toEqual({
    name: 'api.logdash.io',
    url: 'https://api.logdash.io',
    status: 'up',
    pending: false,
  });
  expect(heroMonitor({ ...base, phase: 'creating' })).toEqual({
    name: 'example.com',
    url: 'https://example.com',
    status: 'unknown',
    pending: true,
  });
  expect(
    heroMonitor({ ...base, phase: 'previewing', pings: [ping(50, 0)] }),
  ).toMatchObject({ name: 'example.com', status: 'down' });
  expect(heroMonitor({ ...base, phase: 'error', hasPreview: false }).name).toBe(
    'api.logdash.io',
  );
});

test('a demo with no monitor reads as a placeholder once it loaded', () => {
  expect(demoName({ monitor: null, loaded: false })).toBe('');
  expect(demoName({ monitor: null, loaded: true })).toBe('yourapp.com');
  expect(demoName(demo)).toBe('api.logdash.io');
});

test('a reading sorts pings and reports the latest one', () => {
  const reading = heroReading(demo.pings, [], NOW, 'Waiting');

  expect(reading.stats.map((stat) => stat.value)).toEqual([
    '145 ms',
    '200',
    '100%',
  ]);
  expect(reading.checkingLabel).toBe('Checking every 15 s');
  expect(reading.lastCheckLabel).toBe('15 s ago');
  expect(heroReading([], [], NOW, 'Waiting').lastCheckLabel).toBe('Waiting');
});

test('the uptime stat reads like the app', () => {
  const hour = {
    timestamp: '2026-01-01T00:00:00Z',
    successCount: 199,
    failureCount: 1,
    averageLatencyMs: 120,
  };

  expect(heroReading(demo.pings, [], NOW, 'Waiting').stats[2]).toEqual({
    label: 'Recent uptime',
    value: '100%',
  });
  expect(
    heroReading(demo.pings, [null, hour], NOW, 'Waiting').stats[2],
  ).toEqual({ label: '90-hour uptime', value: '99.50%' });
});
