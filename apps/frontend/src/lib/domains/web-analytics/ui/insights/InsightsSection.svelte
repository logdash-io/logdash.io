<script lang="ts">
  import { resolve } from '$app/paths';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import ResizeIcon from '$lib/domains/shared/icons/ResizeIcon.svelte';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { TOOLBAR_CONTROL } from '$lib/domains/shared/ui/components/toolbar';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { tick } from 'svelte';
  import type { WebAnalyticsInsightsState } from '../../application/web-analytics-dashboard.state.svelte';
  import type {
    WebAnalyticsInsight,
    WebAnalyticsInsightGrid,
    WebAnalyticsView,
  } from '../../domain/web-analytics';
  import {
    GRID_COLUMNS,
    GRID_GAP,
    GRID_ROW,
    gridPlacements,
    gridRows,
    moveCard,
    nudgeCard,
    resizeCard,
    type GridCard,
    type GridKey,
    type ViewLayout,
  } from '../../domain/web-analytics-layout';
  import InsightCard from './InsightCard.svelte';

  type Props = {
    clusterId: string;
    revision: number;
    insights: WebAnalyticsInsightsState;
    layout: ViewLayout;
    onadd: () => void;
    onedit: (insight: WebAnalyticsInsight) => void;
  };

  type Drag = {
    id: string;
    mode: 'move' | 'resize';
    x: number;
    y: number;
    origin: WebAnalyticsInsightGrid;
    base: GridCard[];
  };

  const { clusterId, revision, insights, layout, onadd, onedit }: Props =
    $props();

  const titleId = $props.id();
  const KEYS: string[] = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
  ] satisfies GridKey[];

  let board = $state<HTMLElement>();
  let width = $state(0);
  let drag = $state.raw<Drag | null>(null);
  let preview = $state.raw<GridCard[] | null>(null);
  let offset = $state({ x: 0, y: 0 });

  const elsewhere = $derived(
    insights.views.filter((view) => view.id !== layout.view.id),
  );
  const cards = $derived(preview ?? layout.cards);
  const moving = $derived(drag?.mode === 'move' ? drag : null);
  const landing = $derived(
    moving && cards.find((card) => card.insight.id === moving.id)?.cell,
  );

  function cellOf(card: GridCard): WebAnalyticsInsightGrid {
    if (moving?.id === card.insight.id) return moving.origin;
    return (
      cards.find((entry) => entry.insight.id === card.insight.id)?.cell ??
      card.cell
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

  function handle(event: Event): 'move' | 'resize' | null {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-resize]')) return 'resize';
    if (target?.closest('[data-grip]')) return 'move';
    return null;
  }

  function onPointerDown(event: PointerEvent, card: GridCard): void {
    const mode = handle(event);
    if (!mode || event.button !== 0 || !board) return;
    event.preventDefault();
    const rect = board.getBoundingClientRect();
    drag = {
      id: card.insight.id,
      mode,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      origin: card.cell,
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
    const { id, origin, base } = drag;
    offset = { x, y };
    preview =
      drag.mode === 'move'
        ? moveCard(base, id, origin.x + columns, Math.max(0, origin.y + rows))
        : resizeCard(base, id, origin.w + columns, origin.h + rows);
  }

  function onPointerUp(): void {
    if (!drag) return;
    const next = preview;
    drag = null;
    preview = null;
    if (next) void insights.placeAll(gridPlacements(next));
  }

  function onPointerCancel(): void {
    drag = null;
    preview = null;
  }

  async function onKeyDown(
    event: KeyboardEvent,
    card: GridCard,
  ): Promise<void> {
    const mode = handle(event);
    if (!mode || !KEYS.includes(event.key)) return;
    event.preventDefault();
    const id = card.insight.id;
    const saved = insights.placeAll(
      gridPlacements(
        nudgeCard(layout.cards, id, event.key as GridKey, mode === 'resize'),
      ),
    );
    await tick();
    board
      ?.querySelector<HTMLElement>(
        mode === 'resize' ? `[data-resize="${id}"]` : `[data-grip="${id}"]`,
      )
      ?.focus();
    await saved;
  }
</script>

<svelte:window
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerCancel}
/>

<section
  class="@container/insights flex flex-col gap-2"
  aria-labelledby={titleId}
>
  <header
    class={[
      'flex h-9 items-center justify-between gap-3 pr-1 pl-5',
      { 'sr-only': !layout.view.traffic },
    ]}
  >
    <h2 id={titleId} class="truncate text-[13px] font-medium">
      {layout.view.traffic ? 'Insights' : layout.view.name}
      <span class="text-fg-muted font-normal">
        Saved for everyone on this domain
      </span>
    </h2>
  </header>

  {#if insights.error}
    <p class="text-error px-5 text-sm" role="alert">{insights.error}</p>
  {/if}

  {#if insights.insights === null}
    {#if !insights.error}
      <div class="bg-surface-25-bg h-72 rounded-2xl" aria-hidden="true"></div>
    {/if}
  {:else if !insights.insights.length}
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
  {:else if !layout.cards.length}
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
  {:else}
    <div
      bind:this={board}
      bind:clientWidth={width}
      class={['board', { 'select-none': drag }]}
      style:--row="{GRID_ROW}px"
      style:--gap="{GRID_GAP}px"
      style:--rows={gridRows(cards)}
    >
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
      {#each layout.cards as card (card.insight.id)}
        {@const cell = cellOf(card)}
        {@const lifted = moving?.id === card.insight.id}
        <div
          class={['cell group/cell flex', { lifted }]}
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
          <button
            type="button"
            class="corner text-fg-muted hover:text-fg-default focus-visible:outline-brand pointer-fine:opacity-0 pointer-fine:group-hover/cell:opacity-100 absolute right-0.5 bottom-0.5 size-5 cursor-nwse-resize touch-none items-center justify-center rounded-md transition-opacity focus-visible:opacity-100 focus-visible:outline-2"
            aria-label="Resize {card.insight.title}"
            title="Drag, or use the arrow keys, to resize"
            data-resize={card.insight.id}
          >
            <ResizeIcon class="size-4" />
          </button>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .board {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }

  .cell {
    height: calc(var(--h) * (var(--row) + var(--gap)) - var(--gap));
  }

  .landing,
  .corner {
    display: none;
  }

  @container insights (width >= 48rem) {
    .board {
      display: block;
      position: relative;
      height: calc(var(--rows) * (var(--row) + var(--gap)) - var(--gap));
    }

    .cell {
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
      cursor: grabbing;
    }

    .corner {
      display: flex;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cell {
      transition: none;
    }
  }
</style>
