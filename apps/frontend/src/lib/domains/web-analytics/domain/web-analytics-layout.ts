import type {
  WebAnalyticsInsight,
  WebAnalyticsInsightPlacement,
  WebAnalyticsInsightPlacementUpdate,
  WebAnalyticsInsights,
  WebAnalyticsInsightWidth,
  WebAnalyticsSection,
  WebAnalyticsView,
  WebAnalyticsViewInput,
} from './web-analytics';
import { insightWide } from './web-analytics-insight';

export interface LayoutGroup {
  section: WebAnalyticsSection | null;
  cards: WebAnalyticsInsight[];
}

export interface ViewLayout {
  view: WebAnalyticsView;
  groups: LayoutGroup[];
  hidden: WebAnalyticsInsight[];
}

export interface Arrangement {
  ids?: string[];
  placements?: WebAnalyticsInsightPlacementUpdate[];
}

export type DropTarget = { card: string } | { section: string | null };

export const OVERVIEW_VIEW: WebAnalyticsView = {
  id: '',
  name: 'Overview',
  traffic: true,
  sections: [],
};

export const MAX_VIEWS = 10;
export const MAX_SECTIONS = 20;

const PLACEMENT_KEYS = [
  'view',
  'section',
  'hidden',
  'width',
] as const satisfies readonly (keyof WebAnalyticsInsightPlacement)[];

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
  const shown = own.filter((insight) => !insight.hidden);
  const known = new Set(view.sections.map((section) => section.id));
  return {
    view,
    hidden: own.filter((insight) => insight.hidden),
    groups: [
      {
        section: null,
        cards: shown.filter(
          (insight) => !insight.section || !known.has(insight.section),
        ),
      },
      ...view.sections.map((section) => ({
        section,
        cards: shown.filter((insight) => insight.section === section.id),
      })),
    ],
  };
}

export function insightWidth(
  insight: WebAnalyticsInsight,
): WebAnalyticsInsightWidth {
  return insight.width ?? (insightWide(insight) ? 'full' : 'half');
}

export function otherWidth(
  insight: WebAnalyticsInsight,
): WebAnalyticsInsightWidth {
  return insightWidth(insight) === 'full' ? 'half' : 'full';
}

export function stepArrangement(
  layout: ViewLayout,
  ids: string[],
  id: string,
  offset: -1 | 1,
): Arrangement | null {
  const group = groupOf(layout, id);
  if (!group) return null;
  const neighbour = group.cards[indexIn(group, id) + offset];
  if (!neighbour) return null;
  return {
    ids:
      offset < 0
        ? placeBefore(ids, id, neighbour.id)
        : placeAfter(ids, id, neighbour.id),
  };
}

export function dropArrangement(
  layout: ViewLayout,
  ids: string[],
  id: string,
  target: DropTarget,
): Arrangement | null {
  const from = groupOf(layout, id);
  if (!from) return null;
  if ('card' in target) return dropOnCard(layout, ids, id, from, target.card);
  const to = layout.groups.find(
    (group) => (group.section?.id ?? null) === target.section,
  );
  if (!to) return null;
  const last = to.cards.at(-1);
  if (to === from) {
    return !last || last.id === id
      ? null
      : { ids: placeAfter(ids, id, last.id) };
  }
  return {
    ...(last && { ids: placeAfter(ids, id, last.id) }),
    placements: [{ id, section: target.section }],
  };
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
    sections: view.sections.map((section) => ({ ...section })),
  }));
}

export function viewsProblem(views: WebAnalyticsViewInput[]): string | null {
  if (views.length > MAX_VIEWS) return `Keep at most ${MAX_VIEWS} views`;
  if (hasBlank(views.map((view) => view.name))) return 'Name every view';
  if (hasDuplicate(views.map((view) => view.name)))
    return 'Give each view its own name';
  for (const view of views) {
    if (view.sections.length > MAX_SECTIONS)
      return `Keep at most ${MAX_SECTIONS} sections in ${view.name.trim()}`;
    if (hasBlank(view.sections.map((section) => section.title)))
      return `Name every section in ${view.name.trim()}`;
    if (hasDuplicate(view.sections.map((section) => section.title)))
      return `Give each section in ${view.name.trim()} its own name`;
  }
  return null;
}

function dropOnCard(
  layout: ViewLayout,
  ids: string[],
  id: string,
  from: LayoutGroup,
  card: string,
): Arrangement | null {
  if (card === id) return null;
  const to = groupOf(layout, card);
  if (!to) return null;
  if (to === from) {
    const after = indexIn(from, id) < indexIn(to, card);
    return {
      ids: after ? placeAfter(ids, id, card) : placeBefore(ids, id, card),
    };
  }
  return {
    ids: placeBefore(ids, id, card),
    placements: [{ id, section: to.section?.id ?? null }],
  };
}

function groupOf(layout: ViewLayout, id: string): LayoutGroup | undefined {
  return layout.groups.find((group) => indexIn(group, id) >= 0);
}

function indexIn(group: LayoutGroup, id: string): number {
  return group.cards.findIndex((card) => card.id === id);
}

function placeBefore(ids: string[], id: string, target: string): string[] {
  const rest = ids.filter((entry) => entry !== id);
  rest.splice(rest.indexOf(target), 0, id);
  return rest;
}

function placeAfter(ids: string[], id: string, target: string): string[] {
  const rest = ids.filter((entry) => entry !== id);
  rest.splice(rest.indexOf(target) + 1, 0, id);
  return rest;
}

function withPlacement(
  insight: WebAnalyticsInsight,
  update: WebAnalyticsInsightPlacementUpdate,
): WebAnalyticsInsight {
  const next: WebAnalyticsInsight = { ...insight };
  for (const key of PLACEMENT_KEYS) {
    const value = update[key];
    if (value === null) delete next[key];
    else if (value !== undefined) Object.assign(next, { [key]: value });
  }
  return next;
}

function hasBlank(names: string[]): boolean {
  return names.some((name) => !name.trim());
}

function hasDuplicate(names: string[]): boolean {
  const seen = names.map((name) => name.trim().toLowerCase());
  return seen.some((name, index) => seen.indexOf(name) !== index);
}
