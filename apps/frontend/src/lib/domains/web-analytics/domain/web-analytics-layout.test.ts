import { expect, test } from '@playwright/test';
import type { WebAnalyticsInsight, WebAnalyticsView } from './web-analytics';
import {
  activeView,
  applyArrangement,
  dashboardViews,
  dropArrangement,
  insightView,
  insightWidth,
  OVERVIEW_VIEW,
  otherWidth,
  readLayout,
  stepArrangement,
  viewInputs,
  viewLayout,
  viewsProblem,
} from './web-analytics-layout';

const company: WebAnalyticsView = {
  id: 'v-company',
  name: 'Company',
  traffic: false,
  sections: [],
};
const product: WebAnalyticsView = {
  id: 'v-product',
  name: 'Product',
  traffic: false,
  sections: [
    { id: 's-activation', title: 'Activation', collapsed: false },
    { id: 's-setup', title: 'Setup', collapsed: true },
  ],
};
const views = [company, product];

function card(
  id: string,
  extra: Partial<WebAnalyticsInsight> = {},
): WebAnalyticsInsight {
  return { id, type: 'trend', title: id, days: 30, ...extra };
}

const insights = [
  card('a'),
  card('b', { view: 'v-product' }),
  card('c', { view: 'v-product', section: 's-activation' }),
  card('d', { view: 'v-product', section: 's-activation' }),
  card('e', { view: 'v-product', section: 's-setup', hidden: true }),
  card('f', { view: 'v-gone', section: 's-activation' }),
  card('g', { view: 'v-product', section: 's-gone' }),
];
const ids = insights.map((insight) => insight.id);

function productLayout(list = insights) {
  return viewLayout(views, product, list);
}

test('a domain without views gets one overview view that shows traffic', () => {
  expect(dashboardViews([])).toEqual([OVERVIEW_VIEW]);
  expect(OVERVIEW_VIEW.traffic).toBe(true);
  expect(activeView([], 'anything')).toBe(OVERVIEW_VIEW);
  expect(viewInputs([])).toEqual([
    { id: undefined, name: 'Overview', traffic: true, sections: [] },
  ]);
});

test('a layout from a backend without views reads as the overview layout', () => {
  const layout = readLayout({ insights });
  expect(layout).toEqual({ views: [], insights });
  expect(activeView(layout.views, null)).toBe(OVERVIEW_VIEW);
  expect(readLayout({})).toEqual({ views: [], insights: [] });
  expect(readLayout({ views, insights })).toEqual({ views, insights });
  expect(readLayout({ viewsVersion: 3, views, insights }).viewsVersion).toBe(3);
});

test('the first view is the default for cards with no or an unknown view', () => {
  expect(activeView(views, 'v-product')).toBe(product);
  expect(activeView(views, 'v-gone')).toBe(company);
  expect(activeView(views, null)).toBe(company);
  expect(insightView(views, insights[0])).toBe('v-company');
  expect(insightView(views, insights[5])).toBe('v-company');
  expect(insightView(views, insights[2])).toBe('v-product');
});

test('a view lists its shown cards by section and its hidden cards apart', () => {
  const layout = productLayout();
  expect(
    layout.groups.map((group) => [
      group.section?.id ?? null,
      group.cards.map((entry) => entry.id),
    ]),
  ).toEqual([
    [null, ['b', 'g']],
    ['s-activation', ['c', 'd']],
    ['s-setup', []],
  ]);
  expect(layout.hidden.map((entry) => entry.id)).toEqual(['e']);
  const first = viewLayout(views, company, insights);
  expect(first.groups[0].cards.map((entry) => entry.id)).toEqual(['a', 'f']);
});

test('width follows the stored choice and falls back to the card type', () => {
  expect(insightWidth(card('x'))).toBe('half');
  expect(insightWidth(card('x', { type: 'cohorts' }))).toBe('full');
  expect(insightWidth(card('x', { type: 'cohorts', width: 'half' }))).toBe(
    'half',
  );
  expect(insightWidth(card('x', { width: 'full' }))).toBe('full');
  expect(otherWidth(card('x'))).toBe('full');
  expect(otherWidth(card('x', { type: 'cohorts' }))).toBe('half');
  expect(
    insightWidth(
      card('x', {
        type: 'tabs',
        tabs: [
          { type: 'trend', title: 'One', days: 30 },
          { type: 'cohorts', title: 'Two', days: 30 },
        ],
      }),
    ),
  ).toBe('full');
});

test('moving a card earlier or later swaps it with its visible neighbour', () => {
  const layout = productLayout();
  expect(stepArrangement(layout, ids, 'd', -1)).toEqual({
    ids: ['a', 'b', 'd', 'c', 'e', 'f', 'g'],
  });
  expect(stepArrangement(layout, ids, 'c', 1)).toEqual({
    ids: ['a', 'b', 'd', 'c', 'e', 'f', 'g'],
  });
  expect(stepArrangement(layout, ids, 'c', -1)).toBeNull();
  expect(stepArrangement(layout, ids, 'd', 1)).toBeNull();
  expect(stepArrangement(layout, ids, 'e', 1)).toBeNull();
});

test('dropping a card on another card of its group takes that slot', () => {
  const layout = productLayout();
  expect(dropArrangement(layout, ids, 'c', { card: 'd' })).toEqual({
    ids: ['a', 'b', 'd', 'c', 'e', 'f', 'g'],
  });
  expect(dropArrangement(layout, ids, 'd', { card: 'c' })).toEqual({
    ids: ['a', 'b', 'd', 'c', 'e', 'f', 'g'],
  });
  expect(dropArrangement(layout, ids, 'c', { card: 'c' })).toBeNull();
});

test('dropping a card on a card of another section moves it there', () => {
  const layout = productLayout();
  expect(dropArrangement(layout, ids, 'c', { card: 'b' })).toEqual({
    ids: ['a', 'c', 'b', 'd', 'e', 'f', 'g'],
    placements: [{ id: 'c', section: null }],
  });
  expect(dropArrangement(layout, ids, 'b', { card: 'd' })).toEqual({
    ids: ['a', 'c', 'b', 'd', 'e', 'f', 'g'],
    placements: [{ id: 'b', section: 's-activation' }],
  });
});

test('dropping a card on the end of a section appends it', () => {
  const layout = productLayout();
  expect(
    dropArrangement(layout, ids, 'b', { section: 's-activation' }),
  ).toEqual({
    ids: ['a', 'c', 'd', 'b', 'e', 'f', 'g'],
    placements: [{ id: 'b', section: 's-activation' }],
  });
  expect(dropArrangement(layout, ids, 'b', { section: 's-setup' })).toEqual({
    placements: [{ id: 'b', section: 's-setup' }],
  });
  expect(
    dropArrangement(layout, ids, 'c', { section: 's-activation' }),
  ).toEqual({ ids: ['a', 'b', 'd', 'c', 'e', 'f', 'g'] });
  expect(
    dropArrangement(layout, ids, 'd', { section: 's-activation' }),
  ).toBeNull();
  expect(dropArrangement(layout, ids, 'c', { section: null })).toEqual({
    ids: ['a', 'b', 'd', 'e', 'f', 'g', 'c'],
    placements: [{ id: 'c', section: null }],
  });
  expect(dropArrangement(layout, ids, 'c', { section: 's-gone' })).toBeNull();
});

test('an arrangement orders the cards, sets placements and clears them with null', () => {
  const next = applyArrangement(insights, {
    ids: ['g', 'a'],
    placements: [
      { id: 'a', view: 'v-product', hidden: true, width: 'full' },
      { id: 'c', section: null, width: null },
      { id: 'b' },
    ],
  });
  expect(next.map((entry) => entry.id)).toEqual([
    'g',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ]);
  expect(next[1]).toEqual(
    card('a', { view: 'v-product', hidden: true, width: 'full' }),
  );
  expect(next[3]).toEqual(card('c', { view: 'v-product' }));
  expect(next[2]).toEqual(insights[1]);
  expect(applyArrangement(insights, { placements: [] })).toEqual(insights);
});

test('views are checked for blank and repeated names', () => {
  const [one, two] = viewInputs(views);
  expect(viewsProblem([one, two])).toBeNull();
  expect(viewsProblem([one, { ...two, name: ' company ' }])).toBe(
    'Give each view its own name',
  );
  expect(viewsProblem([one, { ...two, name: '  ' }])).toBe('Name every view');
  expect(
    viewsProblem([
      one,
      {
        ...two,
        sections: [
          { title: 'Setup', collapsed: false },
          { title: 'setup', collapsed: true },
        ],
      },
    ]),
  ).toBe('Give each section in Product its own name');
  expect(
    viewsProblem([
      one,
      { ...two, sections: [{ title: ' ', collapsed: false }] },
    ]),
  ).toBe('Name every section in Product');
});
