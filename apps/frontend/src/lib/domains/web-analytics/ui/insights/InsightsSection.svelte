<script lang="ts">
  import { resolve } from '$app/paths';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { TOOLBAR_CONTROL } from '$lib/domains/shared/ui/components/toolbar';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { tick, type Snippet } from 'svelte';
  import { match } from 'ts-pattern';
  import type { WebAnalyticsInsightsState } from '../../application/web-analytics-dashboard.state.svelte';
  import type {
    WebAnalyticsInsight,
    WebAnalyticsInsightGrid,
    WebAnalyticsTrafficCard,
    WebAnalyticsView,
  } from '../../domain/web-analytics';
  import {
    GRID_COLUMNS,
    GRID_GAP,
    GRID_ROW,
    gridArrangement,
    gridRows,
    gridSeams,
    moveCard,
    nudgeCard,
    resizeEdge,
    resizeSeam,
    sameCell,
    type GridCard,
    type GridEdge,
    type GridKey,
    type GridSeam,
    type ViewLayout,
  } from '../../domain/web-analytics-layout';
  import InsightCard from './InsightCard.svelte';

  type Props = {
    clusterId: string;
    revision: number;
    insights: WebAnalyticsInsightsState;
    layout: ViewLayout;
    arranging: boolean;
    ondone: () => void;
    onadd: () => void;
    onedit: (insight: WebAnalyticsInsight) => void;
    traffic?: Snippet<[WebAnalyticsTrafficCard]>;
  };

  type Grab =
    | { mode: 'move' }
    | { mode: 'edge'; edge: GridEdge }
    | { mode: 'seam'; seam: GridSeam };

  type Drag = Grab & {
    id: string;
    x: number;
    y: number;
    origin: WebAnalyticsInsightGrid;
    base: GridCard[];
  };

  const {
    clusterId,
    revision,
    insights,
    layout,
    arranging,
    ondone,
    onadd,
    onedit,
    traffic,
  }: Props = $props();

  const ARROWS: string[] = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
  ] satisfies GridKey[];
  const EDGES: GridEdge[] = ['l', 'r', 'b', 'bl', 'br'];
  const WIDE = 768;

  let board = $state<HTMLElement>();
  let width = $state(0);
  let drag = $state.raw<Drag | null>(null);
  let preview = $state.raw<GridCard[] | null>(null);
  let offset = $state({ x: 0, y: 0 });

  const elsewhere = $derived(
    insights.views.filter((view) => view.id !== layout.view.id),
  );
  const editing = $derived(arranging && width >= WIDE);
  const cards = $derived(preview ?? layout.cards);
  const moving = $derived(drag?.mode === 'move' ? drag : null);
  const landing = $derived(
    moving && cards.find((card) => card.id === moving.id)?.cell,
  );
  const seams = $derived(editing && !moving ? gridSeams(cards) : []);

  function cellOf(card: GridCard): WebAnalyticsInsightGrid {
    if (moving?.id === card.id) return moving.origin;
    return cards.find((entry) => entry.id === card.id)?.cell ?? card.cell;
  }

  function edgesOf(card: GridCard): GridEdge[] {
    const covered = seams.flatMap((seam) => [
      seam.a === card.id && (seam.axis === 'x' ? 'r' : 'b'),
      seam.axis === 'x' && seam.b === card.id && 'l',
    ]);
    return EDGES.filter((edge) =>
      [...edge].every((side) => !covered.includes(side)),
    );
  }

  function sizing(card: GridCard): boolean {
    if (!drag || drag.mode === 'move') return false;
    return (
      drag.id === card.id || (drag.mode === 'seam' && drag.seam.b === card.id)
    );
  }

  function seamActive(seam: GridSeam): boolean {
    return (
      drag?.mode === 'seam' && drag.seam.a === seam.a && drag.seam.b === seam.b
    );
  }

  function onViewMove(
    insight: WebAnalyticsInsight,
    view: WebAnalyticsView,
  ): void {
    void insights.place(insight.id, { view: view.id, grid: null });
  }

  function onHide(insight: WebAnalyticsInsight): void {
    void insights.place(insight.id, { hidden: true });
  }

  async function onRemove(insight: WebAnalyticsInsight): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Remove insight',
      description: `${insight.title} leaves this dashboard for everyone on this domain.`,
      confirmLabel: 'Remove insight',
    });
    if (confirmed) await insights.remove(insight.id);
  }

  function grab(event: Event): Grab | null {
    const target = event.target instanceof Element ? event.target : null;
    const edge = target?.closest<HTMLElement>('[data-edge]')?.dataset.edge;
    if (edge) return { mode: 'edge', edge: edge as GridEdge };
    if (target?.closest('[data-move]')) return { mode: 'move' };
    return null;
  }

  function onPointerDown(event: PointerEvent, card: GridCard): void {
    const grabbed = grab(event);
    if (grabbed) start(event, card.id, grabbed);
  }

  function onSeamDown(event: PointerEvent, seam: GridSeam): void {
    start(event, seam.a, { mode: 'seam', seam });
  }

  function start(event: PointerEvent, id: string, grabbed: Grab): void {
    const origin = layout.cards.find((card) => card.id === id)?.cell;
    if (!editing || event.button !== 0 || !board || !origin) return;
    event.preventDefault();
    if (event.target instanceof Element && event.isTrusted)
      event.target.setPointerCapture(event.pointerId);
    const rect = board.getBoundingClientRect();
    drag = {
      ...grabbed,
      id,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      origin,
      base: layout.cards,
    };
    offset = { x: 0, y: 0 };
  }

  function onPointerMove(event: PointerEvent): void {
    if (!drag || !board) return;
    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left - drag.x;
    const y = event.clientY - rect.top - drag.y;
    const columns = Math.round(x / ((width + GRID_GAP) / GRID_COLUMNS));
    const rows = Math.round(y / (GRID_ROW + GRID_GAP));
    offset = { x, y };
    preview = match(drag)
      .with({ mode: 'move' }, ({ id, origin, base }) =>
        moveCard(base, id, origin.x + columns, Math.max(0, origin.y + rows)),
      )
      .with({ mode: 'edge' }, ({ id, edge, base }) =>
        resizeEdge(base, id, edge, columns, rows),
      )
      .with({ mode: 'seam' }, ({ seam, base }) =>
        resizeSeam(base, seam, seam.axis === 'x' ? columns : rows),
      )
      .exhaustive();
  }

  function onPointerUp(): void {
    if (!drag) return;
    const { base } = drag;
    const next = preview;
    drag = null;
    preview = null;
    const changed = next?.some(
      (card) =>
        !sameCell(card.cell, base.find(({ id }) => id === card.id)?.cell),
    );
    if (next && changed)
      void insights.arrange(gridArrangement(next, layout.view.id));
  }

  function onPointerCancel(): void {
    drag = null;
    preview = null;
  }

  function onWindowKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !arranging || event.defaultPrevented) return;
    if (
      event.target instanceof Element &&
      event.target.closest('dialog, [popover]')
    )
      return;
    event.preventDefault();
    if (drag) onPointerCancel();
    else ondone();
  }

  async function onKeyDown(
    event: KeyboardEvent,
    card: GridCard,
  ): Promise<void> {
    if (grab(event)?.mode !== 'move' || !ARROWS.includes(event.key)) return;
    event.preventDefault();
    const { id } = card;
    const saved = insights.arrange(
      gridArrangement(
        nudgeCard(layout.cards, id, event.key as GridKey, event.shiftKey),
        layout.view.id,
      ),
    );
    await tick();
    board?.querySelector<HTMLElement>(`[data-move="${id}"]`)?.focus();
    await saved;
  }
</script>

<svelte:window
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerCancel}
  onkeydown={onWindowKeyDown}
/>

<section
  class="@container/insights flex flex-col gap-2"
  aria-label={layout.view.name}
>
  {#if insights.error}
    <p class="text-error px-5 text-sm" role="alert">{insights.error}</p>
  {/if}

  {#if insights.insights === null && !insights.error}
    <div class="bg-surface-25-bg h-72 rounded-2xl" aria-hidden="true"></div>
  {:else}
    {#if layout.cards.length}
      {@render grid()}
    {/if}
    {#if insights.insights?.length === 0}
      {@render empty()}
    {:else if insights.insights && !layout.cards.length}
      <Well label="Nothing in this view">
        <EmptyState
          centered
          title={layout.hidden.length
            ? 'Every card here is hidden'
            : `Nothing in ${layout.view.name} yet`}
          description={layout.hidden.length
            ? 'Bring them back from Hidden above.'
            : 'Add an insight, or move one here from its menu.'}
        />
      </Well>
    {/if}
  {/if}
</section>

{#snippet empty()}
  <Well label="No insights yet">
    <EmptyState
      centered
      title="Turn your events into answers"
      description="Save funnels, trends, histograms and cohort tables of your events. They stay here for everyone on this domain, and your coding agent can build them for you too."
    >
      <div class="flex flex-wrap items-center justify-center gap-2">
        <button type="button" class={TOOLBAR_CONTROL} onclick={onadd}>
          <PlusIcon class="size-3.5" />
          Add insight
        </button>
        <a
          href={resolve('/docs/mcp')}
          class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
        >
          Connect your agent
        </a>
      </div>
    </EmptyState>
  </Well>
{/snippet}

{#snippet grid()}
  <div
    bind:this={board}
    bind:clientWidth={width}
    class={['board', { 'select-none': drag }]}
    style:--row="{GRID_ROW}px"
    style:--gap="{GRID_GAP}px"
    style:--rows={gridRows(cards)}
  >
    {#if editing}
      <div class="guides" aria-hidden="true">
        {#each { length: GRID_COLUMNS }, column (column)}
          <span class="bg-surface-25-bg rounded-xl"></span>
        {/each}
      </div>
    {/if}
    {#if moving && landing}
      <div
        class="cell landing outline-brand rounded-2xl outline-2 outline-dashed"
        style:--x={landing.x}
        style:--y={landing.y}
        style:--w={landing.w}
        style:--h={landing.h}
        aria-hidden="true"
      ></div>
    {/if}
    {#each layout.cards as card (card.id)}
      {@const cell = cellOf(card)}
      {@const lifted = moving?.id === card.id}
      <div
        class={['cell', { lifted, fluid: card.traffic }]}
        style:--x={cell.x}
        style:--y={cell.y}
        style:--w={cell.w}
        style:--h={cell.h}
        style:--dx={lifted ? `${offset.x}px` : null}
        style:--dy={lifted ? `${offset.y}px` : null}
        role="presentation"
        onpointerdown={(event) => onPointerDown(event, card)}
        onkeydown={(event) => onKeyDown(event, card)}
      >
        <div class="contents" inert={editing}>
          {#if card.insight}
            <InsightCard
              {clusterId}
              insight={card.insight}
              {revision}
              {elsewhere}
              {onedit}
              onviewmove={onViewMove}
              onhide={onHide}
              onremove={onRemove}
            />
          {:else if card.traffic}
            {@render traffic?.(card.traffic)}
          {/if}
        </div>
        {#if editing}
          {@render handles(card, cell, lifted)}
        {/if}
      </div>
    {/each}
    {#each seams as seam (`${seam.axis}:${seam.a}:${seam.b}`)}
      <div
        class={[
          'seam',
          seam.axis,
          seamActive(seam)
            ? 'text-fg-default'
            : 'text-fg-faint hover:text-fg-secondary',
        ]}
        style:--x={seam.x}
        style:--y={seam.y}
        style:--length={seam.length}
        role="presentation"
        onpointerdown={(event) => onSeamDown(event, seam)}
      >
        <span class="pill bg-current"></span>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet handles(
  card: GridCard,
  cell: WebAnalyticsInsightGrid,
  lifted: boolean,
)}
  <button
    type="button"
    class={[
      'focus-visible:outline-brand absolute inset-0 z-10 rounded-2xl focus-visible:outline-2',
      lifted
        ? 'ring-surface-150-border cursor-grabbing ring-1'
        : 'hover:ring-surface-150-border cursor-grab hover:ring-1',
    ]}
    aria-label="Move {card.title}"
    title="Drag to move. Arrow keys move it, Shift and arrow keys resize it."
    data-move={card.id}
  ></button>
  {#each edgesOf(card) as edge (edge)}
    <div
      class={[
        'handle',
        edge,
        drag?.mode === 'edge' && drag.id === card.id && drag.edge === edge
          ? 'text-brand'
          : 'text-fg-tertiary hover:text-fg-default',
      ]}
      data-edge={edge}
      aria-hidden="true"
    >
      <span class="bg-current"></span>
    </div>
  {/each}
  {#if sizing(card)}
    <span
      class="bg-surface-inverse-bg text-fg-inverse pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-1/2 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
    >
      {cell.w} × {cell.h}
    </span>
  {/if}
{/snippet}

<style>
  .board {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }

  .cell {
    --height: calc(var(--h) * (var(--row) + var(--gap)) - var(--gap));
  }

  .cell:not(.fluid) {
    height: var(--height);
  }

  .landing,
  .guides,
  .seam {
    display: none;
  }

  @container insights (width >= 48rem) {
    .board {
      display: block;
      position: relative;
      height: calc(var(--rows) * (var(--row) + var(--gap)) - var(--gap));
    }

    .cell {
      height: var(--height);
      position: absolute;
      top: 0;
      left: 0;
      width: calc((100cqw + var(--gap)) / 12 * var(--w) - var(--gap));
      translate: calc((100cqw + var(--gap)) / 12 * var(--x) + var(--dx, 0px))
        calc(var(--y) * (var(--row) + var(--gap)) + var(--dy, 0px));
      transition:
        translate 200ms cubic-bezier(0.2, 0, 0, 1),
        width 200ms cubic-bezier(0.2, 0, 0, 1),
        height 200ms cubic-bezier(0.2, 0, 0, 1);
    }

    .landing {
      display: block;
    }

    .lifted {
      z-index: 10;
      transition: none;
    }

    .guides {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: var(--gap);
      pointer-events: none;
    }

    .seam {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
    }

    .seam.x {
      width: 16px;
      height: calc(var(--length) * (var(--row) + var(--gap)) - var(--gap));
      translate: calc(
          (100cqw + var(--gap)) / 12 * var(--x) - var(--gap) / 2 - 8px
        )
        calc(var(--y) * (var(--row) + var(--gap)));
      cursor: col-resize;
    }

    .seam.y {
      width: calc((100cqw + var(--gap)) / 12 * var(--length) - var(--gap));
      height: 16px;
      translate: calc((100cqw + var(--gap)) / 12 * var(--x))
        calc(var(--y) * (var(--row) + var(--gap)) - var(--gap) / 2 - 8px);
      cursor: row-resize;
    }

    .seam::before {
      content: '';
      position: absolute;
      border-radius: 9999px;
      background-color: currentColor;
    }

    .seam.x::before {
      top: 8px;
      bottom: 8px;
      width: 2px;
    }

    .seam.y::before {
      left: 8px;
      right: 8px;
      height: 2px;
    }

    .pill {
      position: relative;
      border-radius: 9999px;
    }

    .seam.x .pill {
      width: 6px;
      height: 36px;
    }

    .seam.y .pill {
      width: 36px;
      height: 6px;
    }
  }

  .handle {
    position: absolute;
    z-index: 15;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
  }

  .handle > span {
    border-radius: 9999px;
  }

  .handle.l,
  .handle.r {
    top: 24px;
    bottom: 24px;
    width: 14px;
    cursor: ew-resize;
  }

  .handle.l {
    left: -7px;
  }

  .handle.r {
    right: -7px;
  }

  .handle.l > span,
  .handle.r > span {
    width: 4px;
    height: 32px;
  }

  .handle.b {
    left: 24px;
    right: 24px;
    bottom: -7px;
    height: 14px;
    cursor: ns-resize;
  }

  .handle.b > span {
    width: 32px;
    height: 4px;
  }

  .handle.bl,
  .handle.br {
    bottom: -7px;
    width: 18px;
    height: 18px;
  }

  .handle.bl {
    left: -7px;
    cursor: nesw-resize;
  }

  .handle.br {
    right: -7px;
    cursor: nwse-resize;
  }

  .handle.bl > span,
  .handle.br > span {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .cell {
      transition: none;
    }
  }
</style>
