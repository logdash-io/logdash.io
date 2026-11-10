<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { TOOLBAR_CONTROL } from '$lib/domains/shared/ui/components/toolbar';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import type { WebAnalyticsInsightsState } from '../../application/web-analytics-dashboard.state.svelte';
  import type {
    WebAnalyticsInsight,
    WebAnalyticsSection,
    WebAnalyticsView,
  } from '../../domain/web-analytics';
  import {
    insightWidth,
    otherWidth,
    type DropTarget,
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

  const { clusterId, revision, insights, layout, onadd, onedit }: Props =
    $props();

  const titleId = $props.id();

  let toggled = $state<Record<string, boolean>>({});
  let armed = $state<string | null>(null);
  let dragged = $state<string | null>(null);
  let over = $state<string | null>(null);

  const elsewhere = $derived(
    insights.views.filter((view) => view.id !== layout.view.id),
  );
  const shown = $derived(
    layout.groups.reduce((total, group) => total + group.cards.length, 0),
  );

  function isOpen(section: WebAnalyticsSection): boolean {
    return toggled[section.id] ?? !section.collapsed;
  }

  function onToggle(section: WebAnalyticsSection): void {
    toggled[section.id] = !isOpen(section);
  }

  function onMove(insight: WebAnalyticsInsight, offset: -1 | 1): void {
    void insights.step(layout, insight.id, offset);
  }

  function onViewMove(
    insight: WebAnalyticsInsight,
    view: WebAnalyticsView,
  ): void {
    void insights.place(insight.id, { view: view.id, section: null });
  }

  function onHide(insight: WebAnalyticsInsight): void {
    void insights.place(insight.id, { hidden: true });
  }

  function onWidth(insight: WebAnalyticsInsight): void {
    void insights.place(insight.id, { width: otherWidth(insight) });
  }

  async function onRemove(insight: WebAnalyticsInsight): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Remove insight',
      description: `${insight.title} leaves this dashboard for everyone on this domain.`,
      confirmLabel: 'Remove insight',
    });
    if (confirmed) await insights.remove(insight.id);
  }

  function onPointerDown(
    event: PointerEvent,
    insight: WebAnalyticsInsight,
  ): void {
    armed =
      event.target instanceof Element && event.target.closest('[data-grip]')
        ? insight.id
        : null;
  }

  function onDragStart(event: DragEvent, insight: WebAnalyticsInsight): void {
    if (armed !== insight.id || !event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', insight.id);
    setTimeout(() => {
      if (armed === insight.id) dragged = insight.id;
    });
  }

  function onDragEnd(): void {
    dragged = null;
    armed = null;
    over = null;
  }

  function onCardOver(event: DragEvent, insight: WebAnalyticsInsight): void {
    if (!dragged) return;
    event.stopPropagation();
    if (dragged === insight.id) return;
    event.preventDefault();
    over = insight.id;
  }

  async function onCardDrop(
    event: DragEvent,
    insight: WebAnalyticsInsight,
  ): Promise<void> {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    await drop({ card: insight.id });
  }

  function onZoneOver(event: DragEvent, section: string | null): void {
    if (!dragged) return;
    event.preventDefault();
    over = zoneKey(section);
  }

  async function onZoneDrop(
    event: DragEvent,
    section: string | null,
  ): Promise<void> {
    if (!dragged) return;
    event.preventDefault();
    await drop({ section });
  }

  async function drop(target: DropTarget): Promise<void> {
    const id = dragged;
    onDragEnd();
    if (id) await insights.drop(layout, id, target);
  }

  function zoneKey(section: string | null): string {
    return `zone:${section ?? ''}`;
  }
</script>

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
  {:else}
    <div class="flex flex-col gap-5">
      {#each layout.groups as group (group.section?.id ?? 'none')}
        {@const section = group.section}
        {@const zone = zoneKey(section?.id ?? null)}
        {#if section || group.cards.length || dragged}
          <div class="flex flex-col gap-2">
            {#if section}
              <div
                role="presentation"
                ondragover={(event) => onZoneOver(event, section.id)}
                ondrop={(event) => onZoneDrop(event, section.id)}
              >
                <button
                  type="button"
                  class={[
                    'text-fg-tertiary hover:text-fg-default transition-ink focus-visible:outline-brand flex h-7 w-full cursor-pointer items-center gap-1.5 rounded-lg px-3 text-left text-xs font-medium focus-visible:outline-2',
                    { 'outline-brand outline-2 outline-dashed': over === zone },
                  ]}
                  aria-expanded={isOpen(section)}
                  onclick={() => onToggle(section)}
                >
                  <ChevronDownIcon
                    class={[
                      'size-3.5 transition-transform',
                      { '-rotate-90': !isOpen(section) },
                    ]}
                  />
                  <span class="truncate">{section.title}</span>
                  <span class="text-fg-muted font-normal tabular-nums">
                    {group.cards.length}
                  </span>
                </button>
              </div>
            {/if}

            {#if !section || isOpen(section)}
              <div
                class={[
                  'grid gap-2 rounded-2xl @4xl/insights:grid-cols-2',
                  { 'outline-brand outline-2 outline-dashed': over === zone },
                ]}
                role="presentation"
                ondragover={(event) => onZoneOver(event, section?.id ?? null)}
                ondrop={(event) => onZoneDrop(event, section?.id ?? null)}
              >
                {#each group.cards as insight, index (insight.id)}
                  {@const full = insightWidth(insight) === 'full'}
                  <div
                    class={[
                      'flex min-w-0 rounded-2xl',
                      {
                        '@4xl/insights:col-span-2': full,
                        'opacity-50': dragged === insight.id,
                        'outline-brand outline-2 outline-dashed':
                          over === insight.id,
                      },
                    ]}
                    role="presentation"
                    draggable={armed === insight.id}
                    onpointerdown={(event) => onPointerDown(event, insight)}
                    ondragstart={(event) => onDragStart(event, insight)}
                    ondragend={onDragEnd}
                    ondragover={(event) => onCardOver(event, insight)}
                    ondrop={(event) => onCardDrop(event, insight)}
                  >
                    <InsightCard
                      {clusterId}
                      {insight}
                      {revision}
                      width={insightWidth(insight)}
                      first={index === 0}
                      last={index === group.cards.length - 1}
                      {elsewhere}
                      {onedit}
                      onmove={onMove}
                      onviewmove={onViewMove}
                      onhide={onHide}
                      onwidth={onWidth}
                      onremove={onRemove}
                    />
                  </div>
                {:else}
                  {#if section || dragged}
                    <p
                      class="text-fg-muted edge col-span-full rounded-2xl px-5 py-4 text-sm"
                    >
                      {section
                        ? 'No cards in this section. Drag one here, or move one from its menu.'
                        : 'Drop here to take the card out of its section.'}
                    </p>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}

      {#if !shown && !layout.view.sections.length}
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
    </div>
  {/if}
</section>
