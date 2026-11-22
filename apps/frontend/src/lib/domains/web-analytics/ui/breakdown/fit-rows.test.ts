import { expect, test } from '@playwright/test';
import { visibleRows } from './fit-rows';

const bottoms = [40, 80, 120, 160, 200];

test('every row shows when the last one fits and nothing more is known', () => {
  expect(visibleRows(bottoms, 200, 36, false)).toBe(5);
  expect(visibleRows([], 200, 36, false)).toBe(0);
});

test('rows that overflow leave room for the more row', () => {
  expect(visibleRows(bottoms, 199, 36, false)).toBe(4);
  expect(visibleRows(bottoms, 150, 36, false)).toBe(2);
  expect(visibleRows(bottoms, 30, 36, false)).toBe(0);
});

test('a forced more row takes its room even when every row fits', () => {
  expect(visibleRows(bottoms, 200, 36, true)).toBe(4);
  expect(visibleRows(bottoms, 400, 36, true)).toBe(5);
});
