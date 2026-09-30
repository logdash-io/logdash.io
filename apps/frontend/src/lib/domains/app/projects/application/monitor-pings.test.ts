import { expect, test } from '@playwright/test';
import {
  checkIntervalLabel,
  lastCheckLabel,
  monitorStats,
  responseTimes,
  uptimePercent,
  type ChartPing,
} from './monitor-pings';

const START = Date.parse('2026-01-01T00:00:00Z');
const UPTIME = { label: 'Uptime', value: '100%' };

function ping(
  offsetS: number,
  statusCode = 200,
  responseTimeMs = 120,
): ChartPing {
  return {
    createdAt: new Date(START + offsetS * 1_000).toISOString(),
    statusCode,
    responseTimeMs,
  };
}

test('stats show the newest answered check', () => {
  expect(monitorStats([ping(0), ping(15, 503, 80)], UPTIME)).toEqual([
    { label: 'Response', value: '80 ms' },
    { label: 'Status', value: '503' },
    UPTIME,
  ]);
  expect(monitorStats([ping(0), ping(15, 0)], UPTIME).slice(0, 2)).toEqual([
    { label: 'Response', value: '--' },
    { label: 'Status', value: '--' },
  ]);
  expect(monitorStats([], UPTIME)[0].value).toBe('--');
});

test('the check interval skips the gap after the first check', () => {
  expect(checkIntervalLabel([ping(0), ping(2)])).toBeNull();
  expect(checkIntervalLabel([ping(0), ping(2), ping(17), ping(32)])).toBe(
    '15 s',
  );
  expect(checkIntervalLabel([ping(0), ping(5), ping(305), ping(605)])).toBe(
    '5 min',
  );
});

test('the last check reads relative to now', () => {
  expect(lastCheckLabel([], START)).toBeNull();
  expect(lastCheckLabel([ping(0)], START + 3_000)).toBe('Just now');
  expect(lastCheckLabel([ping(0)], START + 13_000)).toBe('13 s ago');
  expect(lastCheckLabel([ping(0)], START + 150_000)).toBe('2 min ago');
});

test('failed checks chart as zero', () => {
  expect(responseTimes([ping(0, 200, 0), ping(15, 500), ping(30)])).toEqual([
    1, 0, 120,
  ]);
});

test('uptime is the share of healthy checks', () => {
  expect(uptimePercent([])).toBeNull();
  expect(uptimePercent([ping(0), ping(15, 500), ping(30), ping(45)])).toBe(75);
});
