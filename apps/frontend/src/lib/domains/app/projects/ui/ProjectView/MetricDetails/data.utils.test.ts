import { expect, test } from '@playwright/test';
import { thinTicks } from './data.utils';

const ticks = Array.from(
  { length: 12 },
  (_, index) => `20:${String(index * 5).padStart(2, '0')}`,
);

test('keeps every tick when they fit', () => {
  expect(thinTicks(ticks, 900)).toEqual(ticks);
});

test('drops ticks so labels never overlap on narrow charts', () => {
  expect(thinTicks(ticks, 300)).toEqual(['20:00', '20:15', '20:30', '20:45']);
});

test('handles no ticks', () => {
  expect(thinTicks([], 300)).toEqual([]);
});
