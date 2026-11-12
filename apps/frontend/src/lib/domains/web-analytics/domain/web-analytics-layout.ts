import type {
  WebAnalyticsInsight,
  WebAnalyticsInsightGrid,
  WebAnalyticsInsightPlacementUpdate,
  WebAnalyticsInsights,
  WebAnalyticsView,
  WebAnalyticsViewInput,
} from './web-analytics';
import { insightWide } from './web-analytics-insight';

export interface GridCard {
  insight: WebAnalyticsInsight;
  cell: WebAnalyticsInsightGrid;
}

export interface ViewLayout {
  view: WebAnalyticsView;
  cards: GridCard[];
  hidden: WebAnalyticsInsight[];
}

export interface Arrangement {
  ids?: string[];
  placements?: WebAnalyticsInsightPlacementUpdate[];
}

export type GridKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

export const OVERVIEW_VIEW: WebAnalyticsView = {
  id: '',
  name: 'Overview',
  traffic: true,
};

export const MAX_VIEWS = 10;

export const GRID_COLUMNS = 12;
export const GRID_ROW = 40;
export const GRID_GAP = 8;
export const MIN_W = 3;
export const MIN_H = 4;
export const MAX_H = 24;
const CARD_H = 8;

export function readLayout(
  layout: Partial<WebAnalyticsInsights>,
): WebAnalyticsInsights {
  return {
    viewsVersion: layout.viewsVersion,
    views: layout.views ?? [],
    insights: layout.insights ?? [],
  };
}

export function dashboardViews(views: WebAnalyticsView[]): WebAnalyticsView[] {
  return views.length ? views : [OVERVIEW_VIEW];
}

export function activeView(
  views: WebAnalyticsView[],
  id: string | null,
): WebAnalyticsView {
  const all = dashboardViews(views);
  return all.find((view) => view.id === id) ?? all[0];
}

export function insightView(
  views: WebAnalyticsView[],
  insight: WebAnalyticsInsight,
): string {
  const all = dashboardViews(views);
  return all.find((view) => view.id === insight.view)?.id ?? all[0].id;
}

export function viewLayout(
  views: WebAnalyticsView[],
  view: WebAnalyticsView,
  insights: WebAnalyticsInsight[],
): ViewLayout {
  const own = insights.filter(
    (insight) => insightView(views, insight) === view.id,
  );
  return {
    view,
    hidden: own.filter((insight) => insight.hidden),
    cards: gridCards(own.filter((insight) => !insight.hidden)),
  };
}

export function gridCards(insights: WebAnalyticsInsight[]): GridCard[] {
  const cards: GridCard[] = insights.flatMap((insight) =>
    insight.grid ? [{ insight, cell: fit(insight.grid) }] : [],
  );
  let floor = Math.max(0, ...cards.map(({ cell }) => cell.y + cell.h));
  for (const insight of insights) {
    if (insight.grid) continue;
    const cell = firstFree(cards, defaultSize(insight), floor);
    cards.push({ insight, cell });
    floor = cell.y;
  }
  return settle(cards);
}

export function moveCard(
  cards: GridCard[],
  id: string,
  x: number,
  y: number,
): GridCard[] {
  return settle(
    reshape(cards, id, (cell) => ({ ...cell, x, y })),
    id,
    true,
  );
}

export function resizeCard(
  cards: GridCard[],
  id: string,
  w: number,
  h: number,
): GridCard[] {
  return settle(
    reshape(cards, id, (cell) => ({ ...cell, w, h })),
    id,
  );
}

export function nudgeCard(
  cards: GridCard[],
  id: string,
  key: GridKey,
  resize: boolean,
): GridCard[] {
  const card = cards.find((entry) => entry.insight.id === id);
  if (!card) return cards;
  const { x, y, w, h } = card.cell;
  if (resize) {
    const dw = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
    const dh = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
    return resizeCard(cards, id, w + dw, h + dh);
  }
  if (key === 'ArrowLeft' || key === 'ArrowRight')
    return settle(
      reshape(cards, id, (cell) => ({
        ...cell,
        x: x + (key === 'ArrowRight' ? 1 : -1),
      })),
      id,
    );
  const column = cards.filter(
    (entry) => entry !== card && sharesColumns(entry.cell, card.cell),
  );
  const target =
    key === 'ArrowUp'
      ? column
          .filter((entry) => entry.cell.y < y)
          .reduce((top, entry) => Math.max(top, entry.cell.y), -1)
      : column
          .filter((entry) => entry.cell.y > y)
          .reduce((top, entry) => Math.min(top, entry.cell.y + 1), Infinity);
  if (target < 0 || target === Infinity) return cards;
  return settle(
    reshape(cards, id, (cell) => ({ ...cell, y: target })),
    id,
  );
}

export function gridPlacements(
  cards: GridCard[],
): WebAnalyticsInsightPlacementUpdate[] {
  return cards
    .filter(({ insight, cell }) => !sameCell(insight.grid, cell))
    .map(({ insight, cell }) => ({ id: insight.id, grid: cell }));
}

export function sameCell(
  a: WebAnalyticsInsightGrid | null | undefined,
  b: WebAnalyticsInsightGrid | null | undefined,
): boolean {
  return a?.x === b?.x && a?.y === b?.y && a?.w === b?.w && a?.h === b?.h;
}

export function gridRows(cards: GridCard[]): number {
  return Math.max(0, ...cards.map(({ cell }) => cell.y + cell.h));
}

export function applyArrangement(
  insights: WebAnalyticsInsight[],
  arrangement: Arrangement,
): WebAnalyticsInsight[] {
  const placed = insights.map((insight) => {
    const update = arrangement.placements?.find(
      (placement) => placement.id === insight.id,
    );
    return update ? withPlacement(insight, update) : insight;
  });
  if (!arrangement.ids) return placed;
  const byId = new Map(placed.map((insight) => [insight.id, insight]));
  const ordered = arrangement.ids.flatMap((id) => byId.get(id) ?? []);
  const rest = placed.filter(
    (insight) => !arrangement.ids?.includes(insight.id),
  );
  return [...ordered, ...rest];
}

export function viewInputs(views: WebAnalyticsView[]): WebAnalyticsViewInput[] {
  return dashboardViews(views).map((view) => ({
    id: view.id || undefined,
    name: view.name,
    traffic: view.traffic,
  }));
}

export function viewsProblem(views: WebAnalyticsViewInput[]): string | null {
  const names = views.map((view) => view.name.trim().toLowerCase());
  if (views.length > MAX_VIEWS) return `Keep at most ${MAX_VIEWS} views`;
  if (names.some((name) => !name)) return 'Name every view';
  if (names.some((name, index) => names.indexOf(name) !== index))
    return 'Give each view its own name';
  return null;
}

function defaultSize(insight: WebAnalyticsInsight): WebAnalyticsInsightGrid {
  return {
    x: 0,
    y: 0,
    w: insightWide(insight) ? GRID_COLUMNS : GRID_COLUMNS / 2,
    h: CARD_H,
  };
}

function fit(cell: WebAnalyticsInsightGrid): WebAnalyticsInsightGrid {
  const w = clamp(cell.w, MIN_W, GRID_COLUMNS);
  return {
    x: clamp(cell.x, 0, GRID_COLUMNS - w),
    y: Math.max(0, Math.round(cell.y)),
    w,
    h: clamp(cell.h, MIN_H, MAX_H),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function reshape(
  cards: GridCard[],
  id: string,
  change: (cell: WebAnalyticsInsightGrid) => WebAnalyticsInsightGrid,
): GridCard[] {
  return cards.map((card) =>
    card.insight.id === id ? { ...card, cell: fit(change(card.cell)) } : card,
  );
}

function settle(
  cards: GridCard[],
  pinned: string | null = null,
  byCenter = false,
): GridCard[] {
  const key = ({ cell }: GridCard): number =>
    cell.y + (byCenter ? cell.h / 2 : 0);
  const pin = (card: GridCard): number => Number(card.insight.id === pinned);
  const order = [...cards].sort(
    (a, b) => key(a) - key(b) || pin(b) - pin(a) || a.cell.x - b.cell.x,
  );
  const done: GridCard[] = [];
  for (const card of order) {
    const y = Math.max(
      0,
      ...done
        .filter((other) => sharesColumns(other.cell, card.cell))
        .map(({ cell }) => cell.y + cell.h),
    );
    done.push({ ...card, cell: { ...card.cell, y } });
  }
  return done;
}

function firstFree(
  cards: GridCard[],
  size: WebAnalyticsInsightGrid,
  floor: number,
): WebAnalyticsInsightGrid {
  for (let y = floor; ; y++) {
    for (let x = 0; x + size.w <= GRID_COLUMNS; x++) {
      const cell = { ...size, x, y };
      if (!cards.some((card) => overlaps(card.cell, cell))) return cell;
    }
  }
}

function sharesColumns(
  a: WebAnalyticsInsightGrid,
  b: WebAnalyticsInsightGrid,
): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w;
}

function overlaps(
  a: WebAnalyticsInsightGrid,
  b: WebAnalyticsInsightGrid,
): boolean {
  return sharesColumns(a, b) && a.y < b.y + b.h && b.y < a.y + a.h;
}

function withPlacement(
  insight: WebAnalyticsInsight,
  update: WebAnalyticsInsightPlacementUpdate,
): WebAnalyticsInsight {
  const next: WebAnalyticsInsight = { ...insight };
  for (const key of ['view', 'hidden', 'grid'] as const) {
    const value = update[key];
    if (value === null) delete next[key];
    else if (value !== undefined) Object.assign(next, { [key]: value });
  }
  return next;
}
