import { expect, test } from '@playwright/test';
import {
  compositePercent,
  downtimeMs,
  formatDuration,
  formatPercent,
  parseAmount,
  parsePercent,
  PERIODS,
} from './uptime';

function downtimes(percent: number): Record<string, string> {
  return Object.fromEntries(
    PERIODS.map((period) => [
      period.noun,
      formatDuration(downtimeMs(percent, period.ms)),
    ]),
  );
}

test('99.9% uses a 365.25-day year, a twelfth of it per month and a quarter per quarter', () => {
  expect(downtimes(99.9)).toEqual({
    day: '1m 26.4s',
    week: '10m 4.8s',
    month: '43m 49.8s',
    quarter: '2h 11m 29.4s',
    year: '8h 45m 57.6s',
  });
});

test('the common SLA levels come out exact to the millisecond', () => {
  expect(downtimes(99.99).year).toBe('52m 35.76s');
  expect(downtimes(99.95).month).toBe('21m 54.9s');
  expect(downtimes(99.5).year).toBe('1d 19h 49m 48s');
  expect(downtimes(99.999).day).toBe('0.864s');
  expect(downtimes(100).year).toBe('0s');
  expect(downtimes(0).year).toBe('365d 6h');
});

test('serial dependencies multiply', () => {
  expect(formatPercent(compositePercent([99.95, 99.99, 99.9]))).toBe(
    '99.8401%',
  );
  expect(compositePercent([99.9])).toBeCloseTo(99.9, 10);
  expect(compositePercent([100, 100])).toBe(100);
});

test('inputs parse the way people type them', () => {
  expect(parsePercent('99.9%')).toBe(99.9);
  expect(parsePercent(' 99,95 ')).toBe(99.95);
  expect(parsePercent('100.1')).toBeNull();
  expect(parsePercent('-1')).toBeNull();
  expect(parsePercent('abc')).toBeNull();
  expect(parseAmount('$1,250.50')).toBe(1250.5);
  expect(parseAmount('')).toBeNull();
});
