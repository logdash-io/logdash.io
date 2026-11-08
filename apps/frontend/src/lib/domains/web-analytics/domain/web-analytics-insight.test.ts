import { expect, test } from '@playwright/test';
import { wilson } from './day-analytics';
import type { WebAnalyticsInsightCohort } from './web-analytics';
import {
  cohortTable,
  commonPrefix,
  funnelRows,
  insightConfig,
  insightDraft,
  insightProblem,
  insightSummary,
  withEventCount,
} from './web-analytics-insight';

test('funnel rows carry conversion, drop-off and overall share', () => {
  expect(
    funnelRows([
      { name: 'first_open', count: 300 },
      { name: 'setup_finished', count: 200 },
      { name: 'first_prompt', count: 0 },
      { name: 'first_merge', count: 0 },
    ]),
  ).toEqual([
    {
      name: 'first_open',
      count: 300,
      conversion: null,
      interval: null,
      dropped: null,
      overall: 100,
    },
    {
      name: 'setup_finished',
      count: 200,
      conversion: (200 / 300) * 100,
      interval: wilson(200, 300),
      dropped: 100,
      overall: (200 / 300) * 100,
    },
    {
      name: 'first_prompt',
      count: 0,
      conversion: 0,
      interval: [0, wilson(0, 200)[1]],
      dropped: 200,
      overall: 0,
    },
    {
      name: 'first_merge',
      count: 0,
      conversion: 0,
      interval: null,
      dropped: 0,
      overall: 0,
    },
  ]);
});

test('a cohort share is judged against the 4 older cohorts that finished its step', () => {
  const cohort = (
    date: string,
    counts: number[],
    filling = [false, false, false],
  ): WebAnalyticsInsightCohort => ({
    cohort: date,
    counts,
    shares: counts.map((count) => (count / counts[0]) * 100),
    filling,
  });
  const usual = [100, 50, 50];
  const { groups, scales } = cohortTable(
    [
      cohort('2026-11-02', [10, 9, 0], [true, true, true]),
      cohort('2026-10-26', [100, 80, 10], [false, false, true]),
      ...[
        '2026-10-19',
        '2026-10-12',
        '2026-10-05',
        '2026-09-28',
        '2026-09-21',
      ].map((date) => cohort(date, usual)),
    ],
    'week',
  );
  const rows = groups.flatMap((group) => group.rows);

  expect(
    groups.map((group) => [group.label, group.rows.map((row) => row.label)]),
  ).toEqual([
    ['November', ['2-8']],
    ['October', ['26 Oct - 1 Nov', '19-25', '12-18', '5-11', '28 Sep - 4 Oct']],
    ['September', ['21-27']],
  ]);
  expect(rows[2].title).toBe('19-25 Oct');
  expect(rows.map((row) => row.cells.map((cell) => cell.flag))).toEqual([
    [0, 0],
    [1, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]);
  // The filling 26 Oct share of 10% stays out of the typical share.
  expect(rows[0].cells[1].typical).toBe(0.5);
  expect(rows[3].cells[0].typical).toBeNull();
  expect(scales[0]).toBeCloseTo(0.9);
  expect(scales[1]).toBeCloseTo(0.6);
});

test('cohorts group by the month of their Thursday, or by year for months', () => {
  const cohort = (date: string): WebAnalyticsInsightCohort => ({
    cohort: date,
    counts: [1],
    shares: [100],
    filling: [false],
  });
  const labels = (dates: string[], bucket: 'day' | 'week' | 'month') =>
    cohortTable(dates.map(cohort), bucket).groups.map((group) => [
      group.label,
      group.rows.map((row) => row.label),
    ]);

  expect(labels(['2026-01-05', '2025-12-29', '2025-12-22'], 'week')).toEqual([
    ['January', ['5-11', '29 Dec - 4 Jan']],
    ['December 2025', ['22-28']],
  ]);
  expect(labels(['2026-01-01', '2025-12-01'], 'month')).toEqual([
    ['2026', ['January']],
    ['2025', ['December']],
  ]);
  expect(labels(['2026-11-02', '2026-11-01'], 'day')).toEqual([
    ['November', ['Mon 2', 'Sun 1']],
  ]);
});

test('the common prefix ends at an underscore and leaves every name a rest', () => {
  expect(
    commonPrefix(['malini_desktop_first_open', 'malini_desktop_first_merge']),
  ).toBe('malini_desktop_first_');
  expect(commonPrefix(['signup', 'sign_in'])).toBe('');
  expect(commonPrefix(['app_day', 'app_'])).toBe('');
  expect(commonPrefix(['malini_desktop_day'])).toBe('');
});

test('a draft keeps only the fields of its type and pads its events', () => {
  const draft = insightDraft();
  expect(draft.events).toHaveLength(2);
  expect(withEventCount(draft.events, 'distribution')).toHaveLength(1);

  draft.type = 'cohorts';
  draft.title = '  Weekly cohorts ';
  draft.events = [
    { name: 'first_open', filters: [] },
    { name: 'returned_week_1', filters: [] },
  ];
  expect(insightConfig(draft)).toEqual({
    type: 'cohorts',
    title: 'Weekly cohorts',
    days: 30,
    events: draft.events,
    filters: [],
    bucket: 'week',
    property: 'cohort',
  });

  draft.type = 'funnel';
  draft.mode = 'people';
  expect(insightProblem(insightConfig(draft))).toBe('Fill in every step');
  draft.steps = ['page:/', 'goal:signup'];
  expect(insightConfig(draft)).toEqual({
    type: 'funnel',
    title: 'Weekly cohorts',
    days: 30,
    mode: 'people',
    steps: ['page:/', 'goal:signup'],
  });
  expect(insightProblem(insightConfig(draft))).toBeNull();
});

test('a config names its first problem', () => {
  const draft = insightDraft({
    type: 'distribution',
    title: 'L30',
    days: 365,
    events: [
      { name: 'month', filters: [{ key: 'month', op: 'eq', value: '' }] },
    ],
  });
  expect(insightProblem(insightConfig(draft))).toBe(
    'Fill in or remove each filter',
  );
  draft.events[0].filters = [];
  expect(insightProblem(insightConfig(draft))).toBe('Pick a numeric property');
  draft.property = 'active_days';
  expect(insightProblem(insightConfig(draft))).toBeNull();
  draft.title = ' ';
  expect(insightProblem(insightConfig(draft))).toBe('Name the insight');
});

test('a summary names the filters every event must match', () => {
  expect(
    insightSummary({
      id: 'a',
      type: 'funnel',
      title: 'Install journey',
      days: 90,
      mode: 'events',
      events: [],
      filters: [{ key: 'cohort', op: 'gte', value: '2026-10-01' }],
    }),
  ).toBe('Events funnel, last 90 days, cohort ≥ 2026-10-01');
  expect(
    insightSummary({
      id: 'b',
      type: 'distribution',
      title: 'L30',
      days: 90,
      property: 'active_days',
      events: [
        {
          name: 'month',
          filters: [{ key: 'month', op: 'eq', value: '2026-10' }],
        },
      ],
      filters: [],
    }),
  ).toBe('active_days, last 90 days, month = 2026-10');
});
