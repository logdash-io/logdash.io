import { expect, test } from '@playwright/test';
import { bucketUptime, fillEmptySlots } from './ping-bucket';

const bucket = (timestamp: string) => ({
  timestamp,
  successCount: 60,
  failureCount: 0,
  averageLatencyMs: 80,
});

test('dates the empty slots on both sides of the first bucket with data', () => {
  const filled = fillEmptySlots(
    [null, null, bucket('2026-09-30T10:00:00.000Z'), null],
    'hour',
  );

  expect(filled.map((slot) => slot.timestamp)).toEqual([
    '2026-09-30T08:00:00.000Z',
    '2026-09-30T09:00:00.000Z',
    '2026-09-30T10:00:00.000Z',
    '2026-09-30T11:00:00.000Z',
  ]);
  expect(filled[0]).toMatchObject({
    successCount: 0,
    failureCount: 0,
    averageLatencyMs: null,
  });
  expect(filled[2]).toEqual(bucket('2026-09-30T10:00:00.000Z'));
});

test('steps by days and ends empty history at the current slot', () => {
  expect(
    fillEmptySlots([null, bucket('2026-09-30T00:00:00.000Z')], 'day')[0]
      ?.timestamp,
  ).toBe('2026-09-29T00:00:00.000Z');
  expect(
    fillEmptySlots(
      [null, null],
      'day',
      Date.parse('2026-09-30T13:30:00.000Z'),
    ).map((slot) => slot.timestamp),
  ).toEqual(['2026-09-29T00:00:00.000Z', '2026-09-30T00:00:00.000Z']);
});

test('shares healthy checks across buckets and has no uptime without checks', () => {
  expect(
    bucketUptime([
      null,
      { ...bucket('2026-09-30T10:00:00.000Z'), successCount: 3 },
      {
        ...bucket('2026-09-30T11:00:00.000Z'),
        successCount: 0,
        failureCount: 1,
      },
    ]),
  ).toBe(75);
  expect(bucketUptime([null, null])).toBeNull();
});
