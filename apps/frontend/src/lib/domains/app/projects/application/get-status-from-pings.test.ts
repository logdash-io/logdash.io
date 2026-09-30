import { expect, test } from '@playwright/test';
import { getStatusFromPings } from './get-status-from-pings';

const UP = { statusCode: 200 };
const DOWN = { statusCode: 503 };

test('reads pings oldest to newest', () => {
  expect(getStatusFromPings([])).toBe('unknown');
  expect(getStatusFromPings([UP, UP, DOWN])).toBe('down');
  expect(getStatusFromPings([DOWN, UP, UP])).toBe('degraded');
  expect(getStatusFromPings([UP, UP, UP])).toBe('up');
});

test('only the newest 10 pings count towards degraded', () => {
  const recovered = [DOWN, ...Array.from({ length: 10 }, () => UP)];
  const failedRecently = [...Array.from({ length: 10 }, () => UP), DOWN, UP];

  expect(getStatusFromPings(recovered)).toBe('up');
  expect(getStatusFromPings(failedRecently)).toBe('degraded');
});
