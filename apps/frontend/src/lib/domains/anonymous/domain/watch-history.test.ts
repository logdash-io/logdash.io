import { expect, test } from '@playwright/test';
import { watchHistory } from './watch-history';

const bucket = (timestamp: string, failureCount = 0) => ({
  timestamp,
  successCount: 60 - failureCount,
  failureCount,
  averageLatencyMs: 80,
});

test('reads inherited history as runs of failing hours, then failing days before them', () => {
  const createdAt = Date.parse('2026-09-28T10:30:00Z');
  const hours = [
    null,
    bucket('2026-09-25T08:00:00Z'),
    bucket('2026-09-25T09:00:00Z', 3),
    bucket('2026-09-25T10:00:00Z', 60),
    null,
    bucket('2026-09-27T14:00:00Z', 1),
    bucket('2026-09-27T15:00:00Z'),
    bucket('2026-09-28T10:00:00Z'),
  ];
  const days = [
    null,
    bucket('2026-09-20T00:00:00Z'),
    bucket('2026-09-21T00:00:00Z', 4),
    bucket('2026-09-22T00:00:00Z', 9),
    bucket('2026-09-23T00:00:00Z'),
    bucket('2026-09-24T00:00:00Z'),
    bucket('2026-09-25T00:00:00Z', 63),
    bucket('2026-09-26T00:00:00Z'),
    bucket('2026-09-27T00:00:00Z', 1),
    bucket('2026-09-28T00:00:00Z'),
  ];

  expect(watchHistory(hours, days, createdAt)).toEqual({
    hours,
    since: new Date('2026-09-20T00:00:00Z'),
    outages: 3,
  });
  expect(watchHistory(hours, [], createdAt)?.since).toEqual(
    new Date('2026-09-25T08:00:00Z'),
  );
  expect(
    watchHistory([null, bucket('2026-09-28T10:00:00Z', 5)], days, createdAt),
  ).toBe(null);
});
