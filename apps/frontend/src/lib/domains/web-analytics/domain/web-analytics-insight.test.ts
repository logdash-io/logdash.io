import { expect, test } from '@playwright/test';
import { wilson } from './day-analytics';
import type {
  WebAnalyticsChartConfig,
  WebAnalyticsInsightCohort,
  WebAnalyticsInsightConfig,
} from './web-analytics';
import {
  cohortTable,
  commonPrefix,
  funnelRows,
  histogramBinLabel,
  insightConfig,
  insightCharts,
  insightDraft,
  insightProblem,
  insightSummary,
  insightWide,
  tabbedConfig,
  tabbedDraft,
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
    layout: 'columns',
    steps: ['page:/', 'goal:signup'],
  });
  expect(insightProblem(insightConfig(draft))).toBeNull();
});

test('a funnel spans the full width as columns above 3 steps', () => {
  const steps = ['page:/', 'goal:a', 'goal:b'];
  const funnel = { type: 'funnel', title: 'Journey', days: 30 } as const;
  expect(insightWide({ ...funnel, mode: 'people', steps })).toBe(false);
  expect(
    insightWide({ ...funnel, mode: 'people', steps: [...steps, 'goal:d'] }),
  ).toBe(true);
  expect(
    insightWide({
      ...funnel,
      mode: 'people',
      layout: 'rows',
      steps: [...steps, 'goal:d'],
    }),
  ).toBe(false);
  expect(
    insightWide({ type: 'cohorts', title: 'Cohorts', days: 90, events: [] }),
  ).toBe(true);
  expect(insightDraft({ ...funnel, layout: 'rows' }).layout).toBe('rows');
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

test('histogram bars of people read in active days', () => {
  expect(histogramBinLabel(1, 1, true)).toBe('1 day');
  expect(histogramBinLabel(3, 1, true)).toBe('3 days');
  expect(histogramBinLabel(0, 7, true)).toBe('1 to 6 days');
  expect(histogramBinLabel(7, 7, true)).toBe('7 to 13 days');
  expect(histogramBinLabel(3, 1, false)).toBe('3');
  expect(histogramBinLabel(0, 7, false)).toBe('0 to 7');
});

test('a people histogram needs no property and drops it', () => {
  const draft = insightDraft({
    type: 'distribution',
    title: 'Grip L30',
    days: 30,
    events: [{ name: 'grip_day', filters: [] }],
  });
  draft.property = 'active_days';
  draft.measure = 'people';
  const config = insightConfig(draft);
  expect(config).toMatchObject({ measure: 'people', binSize: 1 });
  expect(config).not.toHaveProperty('property');
  expect(insightProblem(config)).toBeNull();
  expect(insightSummary(config)).toBe('Active days per person, last 30 days');
  expect(insightDraft(config).measure).toBe('people');

  draft.measure = 'events';
  draft.property = '';
  expect(insightProblem(insightConfig(draft))).toBe('Pick a numeric property');
});

test('a summary names the filters every event must match', () => {
  expect(
    insightSummary({
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

const trend = (title: string, name: string): WebAnalyticsChartConfig => ({
  type: 'trend',
  title,
  days: 30,
  bucket: 'day',
  events: [{ name, filters: [] }],
  filters: [],
});

const tabs = (...titles: string[]): WebAnalyticsInsightConfig => ({
  type: 'tabs',
  title: 'Setup time',
  days: 30,
  tabs: titles.map((title) => trend(title, 'setup_finished')),
});

test('a tabbed card checks its tabs one by one', () => {
  expect(insightProblem(tabs('Start'))).toBe('Add at least 2 tabs');
  expect(insightProblem(tabs('Start', ''))).toBe('Name tab 2');
  expect(insightProblem(tabs('Start', 'start'))).toBe(
    'Give each tab its own name',
  );
  const broken = tabs('Start', 'Finish');
  broken.tabs![1].events = [{ name: '', filters: [] }];
  expect(insightProblem(broken)).toBe('Finish: Pick an event for each row');
  expect(insightProblem(tabs('Start', 'Finish'))).toBeNull();
  expect(insightProblem({ ...tabs('Start', 'Finish'), title: '' })).toBe(
    'Name the insight',
  );
});

test('a card is as wide as its widest tab', () => {
  expect(insightWide(tabs('Start', 'Finish'))).toBe(false);
  const wide = tabs('Start', 'Cohorts');
  wide.tabs![1] = { ...wide.tabs![1], type: 'cohorts' };
  expect(insightWide(wide)).toBe(true);
});

test('a plain card is one chart and a tabbed card is its tabs', () => {
  const plain = trend('Runs', 'run_finished');
  expect(insightCharts(plain)).toEqual([plain]);
  expect(
    insightCharts(tabs('Start', 'Finish')).map((tab) => tab.title),
  ).toEqual(['Start', 'Finish']);
});

test('one draft stays a plain card and two or more become tabs', () => {
  const plain = trend('Runs', 'run_finished');
  const { title, drafts } = tabbedDraft(plain);
  expect(title).toBe('Runs');
  expect(drafts).toHaveLength(1);
  expect(tabbedConfig(title, drafts, { view: 'v1' })).toEqual({
    ...insightConfig(drafts[0]),
    view: 'v1',
  });

  const split = tabbedDraft(tabs('Start', 'Finish'));
  expect(split.title).toBe('Setup time');
  expect(split.drafts.map((draft) => draft.title)).toEqual(['Start', 'Finish']);
  const config = tabbedConfig(' Setup time ', split.drafts, {
    grid: null,
    hidden: null,
  });
  expect(config.type).toBe('tabs');
  expect(config.title).toBe('Setup time');
  expect(config.grid).toBeNull();
  expect(config.hidden).toBeNull();
  expect(config.tabs?.map((tab) => tab.title)).toEqual(['Start', 'Finish']);
  expect(tabbedDraft().drafts).toHaveLength(1);
});

test('a trend keeps the label and bucket of each line and no other chart does', () => {
  const lines = [
    { name: 'malini_desktop_day', filters: [], label: ' Daily ' },
    {
      name: 'malini_desktop_day',
      filters: [{ key: 'week_first', op: 'eq' as const, value: 'yes' }],
      label: 'Weekly',
      bucket: 'week' as const,
    },
    { name: 'malini_desktop_day', filters: [], label: ' ' },
  ];
  const draft = insightDraft({ ...trend('Malini active', 'x'), events: lines });
  expect(draft.events[1]).toMatchObject({ label: 'Weekly', bucket: 'week' });
  expect(insightConfig(draft).events).toEqual([
    { name: 'malini_desktop_day', filters: [], label: 'Daily' },
    { ...lines[1] },
    { name: 'malini_desktop_day', filters: [] },
  ]);

  draft.type = 'cohorts';
  expect(insightConfig(draft).events?.[1]).toEqual({
    name: 'malini_desktop_day',
    filters: lines[1].filters,
  });
});

test('a trend summary names each bucket its lines count per', () => {
  const summary = (bucket: 'day' | 'week' | 'month' | undefined) =>
    insightSummary({
      ...trend('Active', 'day'),
      bucket,
      events: [
        { name: 'day', filters: [] },
        { name: 'day', filters: [], bucket: 'week' },
        { name: 'day', filters: [], bucket: 'month' },
      ],
    });
  expect(summary('day')).toBe('Daily, weekly and monthly, last 30 days');
  expect(summary('week')).toBe('Weekly and monthly, last 30 days');
  expect(insightSummary(trend('Runs', 'run_finished'))).toBe(
    'Daily, last 30 days',
  );
});

test('a trend keeps the people measure and no other chart does', () => {
  const people = {
    ...trend('Active', 'grip_open'),
    measure: 'people' as const,
  };
  const draft = insightDraft(people);
  expect(draft.measure).toBe('people');
  expect(insightConfig(draft)).toMatchObject({
    type: 'trend',
    measure: 'people',
  });
  expect(insightDraft(trend('Active', 'grip_open')).measure).toBe('events');
  expect(
    insightConfig(insightDraft(trend('Active', 'grip_open'))),
  ).not.toHaveProperty('measure');

  draft.measure = 'events';
  expect(insightConfig(draft)).not.toHaveProperty('measure');
  draft.measure = 'people';
  draft.type = 'funnel';
  expect(insightConfig(draft)).not.toHaveProperty('measure');
  draft.type = 'cohorts';
  expect(insightConfig(draft)).not.toHaveProperty('measure');

  expect(insightSummary(people)).toBe('Daily people, last 30 days');
  expect(
    insightSummary({
      ...people,
      events: [
        { name: 'grip_open', filters: [] },
        { name: 'grip_open', filters: [], bucket: 'month' },
      ],
    }),
  ).toBe('Daily and monthly people, last 30 days');
  expect(
    tabbedDraft({ ...tabs('Start', 'Finish'), tabs: [people, people] }).drafts,
  ).toMatchObject([{ measure: 'people' }, { measure: 'people' }]);
});
