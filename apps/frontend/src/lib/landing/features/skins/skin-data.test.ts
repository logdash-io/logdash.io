import { expect, test } from '@playwright/test';
import { dayStatus } from './skin-data';

const day = (successCount: number, failureCount: number) => ({
  timestamp: '2026-09-28T00:00:00.000Z',
  successCount,
  failureCount,
  averageLatencyMs: null,
});

test('grades a day like the hosted status page', () => {
  expect(dayStatus(day(0, 0))).toBe('none');
  expect(dayStatus(day(1440, 0))).toBe('up');
  expect(dayStatus(day(1439, 1))).toBe('up');
  expect(dayStatus(day(1438, 2))).toBe('degraded');
  expect(dayStatus(day(720, 720))).toBe('degraded');
  expect(dayStatus(day(529, 911))).toBe('down');
});
