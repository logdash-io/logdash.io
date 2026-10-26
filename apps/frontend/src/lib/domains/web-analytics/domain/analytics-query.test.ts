import { expect, test } from '@playwright/test';
import { DateTime } from 'luxon';
import { analyticsWindow } from './analytics-period';
import {
  analyticsSearch,
  dayRange,
  filterLabel,
  parseAnalyticsQuery,
} from './analytics-query';
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

test('the URL keeps the day and one filter per dimension, and drops what is not a day', () => {
  const query = parseAnalyticsQuery(
    new URLSearchParams(
      'day=2026-10-25&filter=page:/pricing&filter=page:/docs&filter=email:alice&filter=country:PL',
    ),
  );
  expect(query).toEqual({
    day: '2026-10-25',
    filters: [
      { dimension: 'page', value: '/pricing' },
      { dimension: 'country', value: 'PL' },
    ],
    event: null,
  });
  expect(analyticsSearch(query)).toBe(
    '?day=2026-10-25&filter=page%3A%2Fpricing&filter=country%3APL',
  );
  for (const day of ['2026-02-30', 'yesterday', '2026-10-25T10:00'])
    expect(parseAnalyticsQuery(new URLSearchParams({ day })).day).toBeNull();
  expect(analyticsSearch({ day: null, filters: [], event: null })).toBe('');
});

test('a day reads from its local midnight to the next, hour by hour', () => {
  const range = dayRange('2026-10-25', 'Europe/Warsaw', []);
  expect(range.from.toISOString()).toBe('2026-10-24T22:00:00.000Z');
  expect(range.to.toISOString()).toBe('2026-10-25T23:00:00.000Z');
  expect(range).toMatchObject({ granularity: 'hour', compare: false });
});

test('property filters keep one value per key and reject invalid keys', () => {
  const query = parseAnalyticsQuery(
    new URLSearchParams(
      'filter=prop.mode:zen&filter=prop.mode:classic&filter=prop.theme:dark mode&filter=prop.Mode:x&filter=prop.:x&filter=goal:start',
    ),
  );
  expect(query.filters).toEqual([
    { dimension: 'prop.mode', value: 'zen' },
    { dimension: 'prop.theme', value: 'dark mode' },
    { dimension: 'goal', value: 'start' },
  ]);
  expect(query.filters.map((filter) => filterLabel(filter.dimension))).toEqual([
    'mode',
    'theme',
    'Goal',
  ]);
  expect(analyticsSearch(query)).toBe(
    '?filter=prop.mode%3Azen&filter=prop.theme%3Adark+mode&filter=goal%3Astart',
  );
});

test('the URL keeps the open event and an app filter', () => {
  const query = parseAnalyticsQuery(
    new URLSearchParams('event=agent_run&filter=app:desktop'),
  );
  expect(query.event).toBe('agent_run');
  expect(query.filters).toEqual([{ dimension: 'app', value: 'desktop' }]);
  expect(filterLabel('app')).toBe('App');
  expect(analyticsSearch(query)).toBe('?filter=app%3Adesktop&event=agent_run');
  expect(
    parseAnalyticsQuery(new URLSearchParams('event=Agent run')).event,
  ).toBeNull();
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
