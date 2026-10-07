import { expect, test } from '@playwright/test';
import { DateTime } from 'luxon';
import { allowedGranularities, analyticsWindow } from './analytics-period';
import { analyticsSearch, parseAnalyticsQuery } from './analytics-query';
import { formatDuration, shortDay, visitorName } from './analytics-format';

const now = DateTime.fromISO('2026-10-02T15:30:00', { zone: 'Europe/Warsaw' });

test('periods cover whole local days and shift by their own length', () => {
  const week = analyticsWindow('7d', 0, now);
  expect(week.from.toISOString()).toBe('2026-09-25T22:00:00.000Z');
  expect(week.to.toISOString()).toBe('2026-10-02T22:00:00.000Z');
  expect(week.canGoForward).toBe(false);
  const previous = analyticsWindow('7d', -1, now);
  expect(previous.to.toISOString()).toBe(week.from.toISOString());
  expect(previous.label).toBe('19 Sep – 25 Sep');
  expect(previous.canGoForward).toBe(true);
  const month = analyticsWindow('mtd', 0, now);
  expect(month.from.toISOString()).toBe('2026-09-30T22:00:00.000Z');
  expect(month.to.getTime()).toBe(now.toMillis());
  expect(analyticsWindow('yesterday', 0, now).label).toBe('Yesterday');
});

test('granularities stay within the bucket limits of the range', () => {
  expect(allowedGranularities(analyticsWindow('today', 0, now))).toEqual([
    'hour',
    'day',
  ]);
  expect(allowedGranularities(analyticsWindow('12m', 0, now))).toEqual([
    'day',
    'week',
    'month',
  ]);
});

test('the URL keeps period, granularity, comparison and one filter per dimension', () => {
  const query = parseAnalyticsQuery(
    new URLSearchParams(
      'period=30d&offset=-2&granularity=week&compare=1&filter=page:/pricing&filter=page:/docs&filter=email:alice&filter=country:PL',
    ),
  );
  expect(query).toEqual({
    period: '30d',
    offset: -2,
    granularity: 'week',
    compare: true,
    filters: [
      { dimension: 'page', value: '/pricing' },
      { dimension: 'country', value: 'PL' },
    ],
  });
  expect(analyticsSearch(query)).toBe(
    '?period=30d&offset=-2&granularity=week&compare=1&filter=page%3A%2Fpricing&filter=country%3APL',
  );
  const fallback = parseAnalyticsQuery(
    new URLSearchParams('period=nope&offset=5&granularity=hour'),
  );
  expect(fallback).toMatchObject({
    period: '7d',
    offset: 0,
    granularity: 'hour',
  });
  expect(
    parseAnalyticsQuery(new URLSearchParams('period=12m&granularity=hour'))
      .granularity,
  ).toBe('month');
});

test('durations read like a clock and visitor names are stable', () => {
  expect(formatDuration(0)).toBe('0s');
  expect(formatDuration(475)).toBe('7m 55s');
  expect(formatDuration(3720)).toBe('1h 2m');
  expect(visitorName('a'.repeat(64))).toBe(visitorName('a'.repeat(64)));
  expect(visitorName('a'.repeat(64))).toMatch(/^[a-z]+ [a-z]+ [1-9]\d\d$/);
  expect(visitorName(`00000000${'0'.repeat(56)}`)).not.toBe(
    visitorName(`00000400${'0'.repeat(56)}`),
  );
  expect(shortDay(DateTime.local().toISO() ?? '')).toMatch(/\d:\d\d/);
  expect(shortDay(DateTime.local().minus({ days: 1 }).toISO() ?? '')).toBe(
    'Yesterday',
  );
  expect(shortDay('2026-03-04T12:00:00')).toBe('4 Mar');
});
