import { expect, test } from '@playwright/test';
import type {
  WebAnalyticsInsight,
  WebAnalyticsInsightGrid,
  WebAnalyticsView,
} from './web-analytics';
import {
  activeView,
  applyArrangement,
  dashboardViews,
  gridCards,
  applyTraffic,
  gridArrangement,
  gridRows,
  insightView,
  moveCard,
  nudgeCard,
  OVERVIEW_VIEW,
  readLayout,
  resizeCard,
  viewInputs,
  viewLayout,
  viewsProblem,
  type GridCard,
} from './web-analytics-layout';

const company: WebAnalyticsView = {
  id: 'v-company',
  name: 'Company',
  traffic: false,
};
const product: WebAnalyticsView = {
  id: 'v-product',
  name: 'Product',
  traffic: false,
};
const views = [company, product];

function card(
  id: string,
  extra: Partial<WebAnalyticsInsight> = {},
): WebAnalyticsInsight {
  return { id, type: 'trend', title: id, days: 30, ...extra };
}

function at(
  x: number,
  y: number,
  w: number,
  h: number,
): WebAnalyticsInsightGrid {
  return { x, y, w, h };
}

function cells(cards: GridCard[]): Record<string, WebAnalyticsInsightGrid> {
  return Object.fromEntries(cards.map(({ id, cell }) => [id, cell]));
}

const insights = [
  card('a'),
  card('b', { view: 'v-product' }),
  card('c', { view: 'v-product', hidden: true }),
  card('d', { view: 'v-gone' }),
];

test('a domain without views gets one overview view that shows traffic', () => {
  expect(dashboardViews([])).toEqual([OVERVIEW_VIEW]);
  expect(OVERVIEW_VIEW.traffic).toBe(true);
  expect(activeView([], 'anything')).toBe(OVERVIEW_VIEW);
  expect(viewInputs([])).toEqual([
    { id: undefined, name: 'Overview', traffic: true },
  ]);
});

test('a layout from a backend without views reads as the overview layout', () => {
  const layout = readLayout({ insights });
  expect(layout).toEqual({ views: [], insights });
  expect(activeView(layout.views, null)).toBe(OVERVIEW_VIEW);
  expect(readLayout({})).toEqual({ views: [], insights: [] });
  expect(readLayout({ viewsVersion: 3, views, insights }).viewsVersion).toBe(3);
});

test('the first view is the default for cards with no or an unknown view', () => {
  expect(activeView(views, 'v-product')).toBe(product);
  expect(activeView(views, 'v-gone')).toBe(company);
  expect(insightView(views, insights[0])).toBe('v-company');
  expect(insightView(views, insights[3])).toBe('v-company');
  expect(insightView(views, insights[1])).toBe('v-product');
});

test('a view grids its shown cards and lists its hidden cards apart', () => {
  const layout = viewLayout(views, product, insights);
  expect(layout.cards.map(({ id }) => id)).toEqual(['b']);
  expect(layout.hidden.map((entry) => entry.id)).toEqual(['c']);
  expect(
    viewLayout(views, company, insights).cards.map(({ id }) => id),
  ).toEqual(['a', 'd']);
});

test('cards without a cell flow in pairs, wide ones take the full row', () => {
  const grid = gridCards([
    card('a'),
    card('b'),
    card('c', { type: 'cohorts' }),
    card('d'),
  ]);
  expect(cells(grid)).toEqual({
    a: at(0, 0, 6, 8),
    b: at(6, 0, 6, 8),
    c: at(0, 8, 12, 8),
    d: at(0, 16, 6, 8),
  });
  expect(gridRows(grid)).toBe(24);
});

test('stored cells float up, get clamped, and new cards go below them', () => {
  const grid = gridCards([
    card('a', { grid: at(0, 30, 6, 4) }),
    card('b', { grid: at(10, 2, 9, 40) }),
    card('c'),
  ]);
  expect(cells(grid)).toEqual({
    a: at(0, 24, 6, 4),
    b: at(3, 0, 9, 24),
    c: at(0, 28, 6, 8),
  });
});

test('a laid out grid stays as it is', () => {
  const grid = gridCards([
    card('a', { grid: at(0, 0, 6, 4) }),
    card('b', { grid: at(6, 0, 6, 12) }),
    card('c', { grid: at(0, 4, 6, 4) }),
    card('d', { grid: at(0, 12, 12, 4) }),
  ]);
  expect(cells(grid)).toEqual({
    a: at(0, 0, 6, 4),
    b: at(6, 0, 6, 12),
    c: at(0, 4, 6, 4),
    d: at(0, 12, 12, 4),
  });
  expect(gridArrangement(grid, company.id)).toEqual({ placements: [] });
});

const stack = gridCards([
  card('a', { grid: at(0, 0, 12, 6) }),
  card('b', { grid: at(0, 6, 12, 6) }),
  card('c', { grid: at(0, 12, 12, 6) }),
]);

test('dragging a card past the middle of another swaps them', () => {
  expect(cells(moveCard(stack, 'a', 0, 5))).toEqual(cells(stack));
  expect(cells(moveCard(stack, 'a', 0, 7))).toEqual({
    b: at(0, 0, 12, 6),
    a: at(0, 6, 12, 6),
    c: at(0, 12, 12, 6),
  });
  expect(cells(moveCard(stack, 'c', 0, 0))).toEqual({
    c: at(0, 0, 12, 6),
    a: at(0, 6, 12, 6),
    b: at(0, 12, 12, 6),
  });
});

test('dragging a card beside another fills the gap and others fall up', () => {
  const column = gridCards([
    card('a', { grid: at(0, 0, 6, 6) }),
    card('b', { grid: at(0, 6, 6, 6) }),
    card('c', { grid: at(0, 12, 6, 6) }),
  ]);
  expect(cells(moveCard(column, 'c', 6, 0))).toEqual({
    a: at(0, 0, 6, 6),
    c: at(6, 0, 6, 6),
    b: at(0, 6, 6, 6),
  });
  const pair = resizeCard(resizeCard(stack, 'a', 6, 6), 'b', 6, 6);
  expect(cells(moveCard(pair, 'b', 6, 0))).toEqual({
    a: at(0, 0, 6, 6),
    b: at(6, 0, 6, 6),
    c: at(0, 6, 12, 6),
  });
});

test('resizing pushes the cards below down and clamps to the grid', () => {
  expect(cells(resizeCard(stack, 'a', 12, 10))).toEqual({
    a: at(0, 0, 12, 10),
    b: at(0, 10, 12, 6),
    c: at(0, 16, 12, 6),
  });
  expect(cells(resizeCard(stack, 'a', 1, 99)).a).toEqual(at(0, 0, 3, 24));
  const narrow = resizeCard(stack, 'a', 4, 6);
  expect(cells(resizeCard(narrow, 'b', 6, 6)).b).toEqual(at(0, 6, 6, 6));
});

test('arrow keys swap with the card above or below, shift resizes', () => {
  expect(nudgeCard(stack, 'b', 'ArrowUp', false).map(({ id }) => id)).toEqual([
    'b',
    'a',
    'c',
  ]);
  expect(cells(nudgeCard(stack, 'b', 'ArrowDown', false))).toEqual({
    a: at(0, 0, 12, 6),
    c: at(0, 6, 12, 6),
    b: at(0, 12, 12, 6),
  });
  expect(nudgeCard(stack, 'a', 'ArrowUp', false)).toBe(stack);
  expect(nudgeCard(stack, 'c', 'ArrowDown', false)).toBe(stack);
  expect(cells(nudgeCard(stack, 'a', 'ArrowLeft', true)).a).toEqual(
    at(0, 0, 11, 6),
  );
  expect(cells(nudgeCard(stack, 'a', 'ArrowDown', true)).b).toEqual(
    at(0, 7, 12, 6),
  );
  const small = resizeCard(stack, 'a', 6, 6);
  expect(cells(nudgeCard(small, 'a', 'ArrowRight', false)).a).toEqual(
    at(1, 0, 6, 6),
  );
});

test('placements list only the cards whose cell changed', () => {
  expect(gridArrangement(moveCard(stack, 'a', 0, 7), company.id)).toEqual({
    placements: [
      { id: 'b', grid: at(0, 0, 12, 6) },
      { id: 'a', grid: at(0, 6, 12, 6) },
    ],
  });
  expect(gridArrangement(gridCards([card('a')]), company.id)).toEqual({
    placements: [{ id: 'a', grid: at(0, 0, 6, 8) }],
  });
});

const overview: WebAnalyticsView = {
  id: 'v-overview',
  name: 'Overview',
  traffic: true,
};

test('a fresh traffic view puts the day on top, then insights, then details', () => {
  const grid = viewLayout([overview], overview, [
    card('a', { grid: at(0, 0, 12, 4) }),
    card('b', { type: 'cohorts' }),
  ]).cards;
  expect(cells(grid)).toEqual({
    day: at(0, 0, 12, 13),
    sources: at(0, 13, 12, 5),
    firstPages: at(0, 18, 12, 5),
    visits: at(0, 23, 12, 11),
    a: at(0, 34, 12, 4),
    b: at(0, 38, 12, 8),
    channels: at(0, 46, 8, 8),
    pages: at(8, 46, 4, 8),
    goals: at(0, 54, 4, 8),
    countries: at(4, 54, 4, 8),
    technology: at(8, 54, 4, 8),
    journeys: at(0, 62, 12, 10),
  });
  expect(grid.find((entry) => entry.id === 'day')?.title).toBe('Day');
});

const stored: WebAnalyticsView = {
  ...overview,
  cards: [
    { id: 'day', grid: at(0, 0, 6, 13) },
    { id: 'visits', grid: at(6, 0, 6, 11) },
  ],
};
const storedInsights = [card('a', { grid: at(0, 13, 12, 4) })];

test('stored traffic cells stay and the missing traffic cards flow below', () => {
  const grid = viewLayout([stored], stored, storedInsights).cards;
  expect(cells(grid)).toEqual({
    day: at(0, 0, 6, 13),
    visits: at(6, 0, 6, 11),
    a: at(0, 13, 12, 4),
    sources: at(0, 17, 12, 5),
    firstPages: at(0, 22, 12, 5),
    channels: at(0, 27, 8, 8),
    pages: at(8, 27, 4, 8),
    goals: at(0, 35, 4, 8),
    countries: at(4, 35, 4, 8),
    technology: at(8, 35, 4, 8),
    journeys: at(0, 43, 12, 10),
  });
});

test('an arrangement stores every traffic cell once one of them moved', () => {
  const grid = viewLayout([stored], stored, storedInsights).cards;
  const first = gridArrangement(grid, stored.id);
  expect(first.placements).toEqual([]);
  expect(first.traffic?.view).toBe(stored.id);
  expect(first.traffic?.cards.map(({ id }) => id)).toEqual([
    'day',
    'visits',
    'sources',
    'firstPages',
    'channels',
    'pages',
    'goals',
    'countries',
    'technology',
    'journeys',
  ]);

  const [saved] = applyTraffic([stored], first.traffic!);
  const again = viewLayout([saved], saved, storedInsights).cards;
  expect(cells(again)).toEqual(cells(grid));
  expect(gridArrangement(again, saved.id)).toEqual({ placements: [] });

  const taller = gridArrangement(resizeCard(again, 'day', 6, 14), saved.id);
  expect(taller.placements).toEqual([{ id: 'a', grid: at(0, 14, 12, 4) }]);
  expect(taller.traffic?.cards[0]).toEqual({
    id: 'day',
    grid: at(0, 0, 6, 14),
  });
});

test('traffic cells of the virtual overview land on it', () => {
  const cards = [{ id: 'day' as const, grid: at(0, 0, 12, 13) }];
  expect(applyTraffic([], { view: '', cards })).toEqual([
    { ...OVERVIEW_VIEW, cards },
  ]);
  expect(applyTraffic([company, stored], { view: stored.id, cards })).toEqual([
    company,
    { ...stored, cards },
  ]);
});

test('an arrangement orders the cards, sets placements and clears them with null', () => {
  const next = applyArrangement(insights, {
    ids: ['d', 'a'],
    placements: [
      { id: 'a', view: 'v-product', hidden: true, grid: at(0, 0, 6, 4) },
      { id: 'b', view: null },
      { id: 'c' },
    ],
  });
  expect(next.map((entry) => entry.id)).toEqual(['d', 'a', 'b', 'c']);
  expect(next[1]).toEqual(
    card('a', { view: 'v-product', hidden: true, grid: at(0, 0, 6, 4) }),
  );
  expect(next[2]).toEqual(card('b'));
  expect(next[3]).toEqual(insights[2]);
  expect(
    applyArrangement(next, { placements: [{ id: 'a', grid: null }] })[1].grid,
  ).toBeUndefined();
});

test('views are checked for blank and repeated names', () => {
  const [one, two] = viewInputs(views);
  expect(viewsProblem([one, two])).toBeNull();
  expect(viewsProblem([one, { ...two, name: ' company ' }])).toBe(
    'Give each view its own name',
  );
  expect(viewsProblem([one, { ...two, name: '  ' }])).toBe('Name every view');
});
