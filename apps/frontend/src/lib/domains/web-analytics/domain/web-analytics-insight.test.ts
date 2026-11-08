import { expect, test } from '@playwright/test';
import {
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
      dropped: null,
      overall: 100,
    },
    {
      name: 'setup_finished',
      count: 200,
      conversion: (200 / 300) * 100,
      dropped: 100,
      overall: (200 / 300) * 100,
    },
    {
      name: 'first_prompt',
      count: 0,
      conversion: 0,
      dropped: 200,
      overall: 0,
    },
    { name: 'first_merge', count: 0, conversion: 0, dropped: 0, overall: 0 },
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
