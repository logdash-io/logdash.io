import { expect, test } from '@playwright/test';
import { relativeAge } from './relative-age';

test('relativeAge picks the largest whole unit at each boundary', () => {
  expect(relativeAge(0)).toBe('0s');
  expect(relativeAge(59_999)).toBe('59s');
  expect(relativeAge(60_000)).toBe('1m');
  expect(relativeAge(3_599_999)).toBe('59m');
  expect(relativeAge(3_600_000)).toBe('1h');
  expect(relativeAge(86_399_999)).toBe('23h');
  expect(relativeAge(86_400_000)).toBe('1d');
});
