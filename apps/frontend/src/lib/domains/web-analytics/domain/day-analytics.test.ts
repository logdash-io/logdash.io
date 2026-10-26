import { expect, test } from '@playwright/test';
import {
  countFlag,
  dayHeadline,
  formatInterval,
  groupRows,
  isRecord,
  judge,
  median,
  parseGoals,
  quantile,
  rateFlag,
  stripDays,
  stripSummary,
  typicalHours,
  typicalOf,
  wilson,
  type GroupRow,
} from './day-analytics';
import type {
  WebAnalyticsDay,
  WebAnalyticsDayCounts,
  WebAnalyticsDays,
} from './web-analytics';

test('flags a count only outside typical ± 2√typical and a rate only when the typical rate leaves its 95% interval', () => {
  const [low, high] = wilson(5, 225);
  expect(low).toBeCloseTo(0.0095, 3);
  expect(high).toBeCloseTo(0.0512, 3);
  expect(wilson(0, 10)[0]).toBe(0);
  expect(formatInterval(wilson(116, 225))).toBe('45-58%');
  expect([countFlag(213, 152), countFlag(21, 15.2), countFlag(3, 0)]).toEqual([
    1, 0, 1,
  ]);
  expect([countFlag(2, 0), countFlag(10, null)]).toEqual([0, 0]);
  expect(rateFlag(116, 225, 0.642, Infinity)).toBe(-1);
  expect(rateFlag(12, 23, 0.642, Infinity)).toBe(0);
  expect(rateFlag(0, 1, 1, 2)).toBe(0);
  expect(median([1, 3, 2, 4])).toBe(2.5);
  expect(quantile([0, 10], 0.25)).toBe(2.5);
  expect(median([])).toBeNull();
});

test('a typical rate shrinks each day toward the pooled rate, so one broken day or sparse days do not skew it', () => {
  const broken = [161, 161, 161, 35].map((hits) => counts(4600, hits, 0));
  expect(typicalOf(broken, 1).stayRate).toBeCloseTo(0.035, 3);
  const sparse = [0, 0, 0, 4].map((hits) => counts(40, hits, 0));
  expect(typicalOf(sparse, 1).stayRate).toBeGreaterThan(0.01);
  const quietMorning = typicalOf(
    [0, 0, 0, 0].map(() => counts(15, 0, 0)),
    1,
  );
  expect(judge(counts(13, 1, 0), quietMorning).stayed.flag).toBe(0);
  const bigQuiet = typicalOf(
    [0, 0, 0, 0].map(() => counts(4000, 0, 0)),
    1,
  );
  expect(judge(counts(4000, 30, 0), bigQuiet).stayed.flag).toBe(1);
  const typical = typicalOf([counts(150, 100, 5), counts(156, 100, 5)], 1);
  expect(typical).toMatchObject({ visits: 153, baseline: 306 });
  expect(judge(counts(222, 122, 6), typical)).toMatchObject({
    visits: { value: 222, typical: 153, flag: 1 },
    stayed: { rate: 122 / 222, flag: -1 },
    goals: [{ value: 6, typical: 5, flag: 0 }],
  });
});

test('a goal counts people on its own, judged against the same weekdays like visits, whatever the visits did', () => {
  const typical = typicalOf(
    [
      counts(150, 100, 40),
      counts(156, 100, 44),
      counts(153, 100, 60),
      counts(140, 90, 48),
    ],
    1,
  );
  expect(typical.goals).toEqual([46]);
  expect(typical.goalRanges).toEqual([[43, 51]]);
  expect(judge(counts(10, 6, 80), typical).goals).toEqual([
    { value: 80, typical: 46, flag: 1 },
  ]);
  expect(judge(counts(400, 300, 46), typical).goals[0].flag).toBe(0);
  expect(judge(counts(150, 100, 20), typical).goals[0].flag).toBe(-1);
});

test('the strip compares today with the same weekdays up to the same time, and leaves out days before the first visit', () => {
  const days: WebAnalyticsDayCounts[] = Array.from(
    { length: 56 },
    (_, index) => ({
      date: date(index),
      visits: index < 10 ? 0 : 100,
      stayed: 60,
      goals: [3],
    }),
  );
  const data: WebAnalyticsDays = {
    today: date(55),
    elapsed: 36_000,
    since: date(10),
    from: date(28),
    to: date(55),
    days: days.map((day) =>
      day.date === date(55) ? { ...day, visits: 70 } : day,
    ),
    todayTypical: [48, 41, 34, 27].map((index) => ({
      date: date(index),
      visits: 40,
      stayed: 24,
      goals: [1],
    })),
    sources: [],
    online: 3,
  };

  const strip = stripDays(data, 1);

  expect(strip).toHaveLength(28);
  expect(strip[27]).toMatchObject({
    inProgress: true,
    fullVisits: 100,
    typical: { visits: 40 },
    verdict: { visits: { flag: 1 } },
  });
  expect(strip[0]).toMatchObject({
    date: date(28),
    typical: { visits: 100, baseline: 200 },
  });
  const summary = stripSummary(strip);
  expect(summary).toMatchObject({ visits: 100, flagged: 1 });
  expect(summary.stayRate).toBeCloseTo(0.6);
  expect(summary.goals).toEqual([3]);
  expect(isRecord(strip, date(55))).toBe(false);
});

test('the hour chart compares with the median hour of the earlier weekdays, smoothed with its neighbours', () => {
  const day: WebAnalyticsDay = {
    date: date(55),
    dates: [date(55), date(48), date(41), date(34), date(27)],
    cutoff: null,
    hours: [hours(9), hours(4), hours(8), hours(0), hours(8)],
    goalHours: [],
    sourceHours: [],
    sources: [],
    pages: [],
  };
  expect(typicalHours(day, date(30))?.[12]).toBe(4);
  expect(typicalHours(day, date(0))?.[12]).toBe(6);
  expect(typicalHours(day, null)).toBeNull();
});

test('source rows sort by visits, keep usual sources that sent nobody yet, and drop the rest', () => {
  const dates = [date(55), date(48), date(41), date(34), date(27)];
  const rows = groupRows(
    [
      {
        name: 'github.com',
        days: dates.map((_, index) => groupCounts(index ? 20 : 22)),
      },
      {
        name: 'news.ycombinator.com',
        days: dates.map((_, index) =>
          index ? groupCounts(4) : groupCounts(60, 6),
        ),
      },
      {
        name: 'x.com',
        days: dates.map((_, index) => groupCounts(index ? 3 : 0)),
      },
      {
        name: 'once.example',
        days: dates.map((_, index) => groupCounts(index === 4 ? 1 : 0)),
      },
    ],
    dates,
    date(0),
  );
  expect(rows.map((row) => row.name)).toEqual([
    'news.ycombinator.com',
    'github.com',
    'x.com',
  ]);
  expect(rows[0].verdict.visits.flag).toBe(1);
});

test('the headline tells what is beyond noise, most urgent first, and calls a quiet day normal', () => {
  const typical = typicalOf(
    [counts(150, 100, 5), counts(156, 100, 5), counts(153, 100, 5)],
    1,
  );
  const hackerNews: GroupRow = {
    name: 'news.ycombinator.com',
    counts: counts(60, 11, 0),
    medianSeconds: 6,
    typical: typicalOf([counts(4, 2, 0), counts(5, 3, 0), counts(3, 2, 0)], 1),
    verdict: judge(
      counts(60, 11, 0),
      typicalOf([counts(4, 2, 0), counts(5, 3, 0), counts(3, 2, 0)], 1),
    ),
  };
  const busy = {
    date: '2026-10-25',
    inProgress: true,
    time: '15:40',
    goals: ['signup'],
    sources: [hackerNews],
    record: false,
  };
  expect(
    dayHeadline({ ...busy, verdict: judge(counts(222, 122, 6), typical) }),
  ).toBe(
    'Busier than a usual Sunday: 222 visits by 15:40, usually 153. news.ycombinator.com sent 60, usually 4, and most left within seconds. Fewer visits stayed than usual: 55%, usually 65%.',
  );
  expect(
    dayHeadline({
      ...busy,
      inProgress: false,
      verdict: judge(counts(153, 100, 0), typical),
    }),
  ).toBe('Fewer people did signup than on a usual Sunday: 0, usually 5.');
  expect(
    dayHeadline({ ...busy, verdict: judge(counts(153, 100, 5), typical) }),
  ).toBe('A normal Sunday so far.');
  expect(
    dayHeadline({ ...busy, verdict: judge(counts(0, 0, 0), typical) }),
  ).toBe('No visits yet today.');
  expect(
    dayHeadline({ ...busy, verdict: judge(counts(0, 0, 12), typical) }),
  ).toBe(
    'Quieter than a usual Sunday: 0 visits by 15:40, usually 153. More people did signup than on a usual Sunday: 12 by 15:40, usually 5.',
  );
});

function counts(
  visits: number,
  stayed: number,
  goal: number,
): { visits: number; stayed: number; goals: number[] } {
  return { visits, stayed, goals: [goal] };
}

function groupCounts(
  visits: number,
  stayed = Math.round(visits * 0.7),
): { visits: number; stayed: number; medianSeconds: number } {
  return { visits, stayed, medianSeconds: 30 };
}

function hours(noon: number): number[] {
  return Array.from({ length: 24 }, (_, hour) =>
    hour === 12 ? noon : hour === 11 || hour === 13 ? noon : 0,
  );
}

function date(index: number): string {
  return new Date(Date.UTC(2026, 7, 31 + index)).toISOString().slice(0, 10);
}

test('reads picked goals from the cookie only when it holds up to 10 names', () => {
  expect(parseGoals('["signup","download"]')).toEqual(['signup', 'download']);
  expect(parseGoals('[]')).toEqual([]);
  expect(parseGoals(undefined)).toBeNull();
  expect(parseGoals('not json')).toBeNull();
  expect(parseGoals('{"0":"signup"}')).toBeNull();
  expect(parseGoals('["signup",1]')).toBeNull();
  expect(parseGoals(JSON.stringify(Array(11).fill('signup')))).toBeNull();
});
