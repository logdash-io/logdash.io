<script lang="ts">
  import {
    MENU_PANEL,
    MENU_ROW,
    onMenuArrowKeys,
  } from '$lib/domains/app/clusters/ui/menu';
  import ExpandIcon from '$lib/domains/shared/icons/ExpandIcon.svelte';
  import EyeOffIcon from '$lib/domains/shared/icons/EyeOffIcon.svelte';
  import GripIcon from '$lib/domains/shared/icons/GripIcon.svelte';
  import MoreIcon from '$lib/domains/shared/icons/MoreIcon.svelte';
  import ShrinkIcon from '$lib/domains/shared/icons/ShrinkIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { Dropdown, Tab, Tabs } from '@logdash/hyper-ui/presentational';
  import type {
    WebAnalyticsInsight,
    WebAnalyticsInsightWidth,
    WebAnalyticsView,
  } from '../../domain/web-analytics';
  import { insightCharts } from '../../domain/web-analytics-insight';
  import InsightBody from './InsightBody.svelte';

  type Props = {
    clusterId: string;
    insight: WebAnalyticsInsight;
    revision: number;
    width: WebAnalyticsInsightWidth;
    first: boolean;
    last: boolean;
    elsewhere: WebAnalyticsView[];
    onedit: (insight: WebAnalyticsInsight) => void;
    onmove: (insight: WebAnalyticsInsight, offset: -1 | 1) => void;
    onviewmove: (insight: WebAnalyticsInsight, view: WebAnalyticsView) => void;
    onhide: (insight: WebAnalyticsInsight) => void;
    onwidth: (insight: WebAnalyticsInsight) => void;
    onremove: (insight: WebAnalyticsInsight) => void;
  };

  const {
    clusterId,
    insight,
    revision,
    width,
    first,
    last,
    elsewhere,
    onedit,
    onmove,
    onviewmove,
    onhide,
    onwidth,
    onremove,
  }: Props = $props();

  const charts = $derived(insightCharts(insight));
  const tabbed = $derived(insight.type === 'tabs');

  let picked = $state(0);
  let visited = $state([0]);
  let summaries = $state<string[]>([]);

  const active = $derived(Math.min(picked, charts.length - 1));
  const summary = $derived(summaries[active] ?? '');
  const full = $derived(width === 'full');

  function onTab(index: number): void {
    picked = index;
    if (!visited.includes(index)) visited.push(index);
  }
</script>

<Well label={insight.title} class="group/card @container h-full flex-1">
  {#snippet header()}
    <h3
      class="flex h-[1lh] min-w-0 flex-wrap items-baseline gap-x-2 overflow-hidden px-3 text-[13px]"
    >
      <span class="max-w-full shrink-0 truncate font-medium">
        {insight.title}
      </span>
      <span class="text-fg-muted grow basis-16 truncate" title={summary}>
        {summary}
      </span>
    </h3>
  {/snippet}

  {#snippet actions()}
    <div
      class="pointer-fine:opacity-0 pointer-fine:group-hover/card:opacity-100 pointer-fine:group-focus-within/card:opacity-100 flex items-center gap-0.5 transition-opacity"
    >
      <div class="hidden @4xl/insights:contents">
        <IconButton
          well
          label={full ? 'Make half width' : 'Make full width'}
          onclick={() => onwidth(insight)}
        >
          {#if full}
            <ShrinkIcon class="size-4" />
          {:else}
            <ExpandIcon class="size-4" />
          {/if}
        </IconButton>
      </div>
      <IconButton
        well
        label="Hide {insight.title}"
        onclick={() => onhide(insight)}
      >
        <EyeOffIcon class="size-4" />
      </IconButton>
      <IconButton
        well
        label="Drag {insight.title}"
        tooltip="Drag to move"
        class="cursor-grab"
        data-grip="true"
      >
        <GripIcon class="size-4" />
      </IconButton>
    </div>
    <Dropdown align="end">
      {#snippet trigger(attrs)}
        <button
          {...attrs}
          type="button"
          class="hover:bg-surface-25-hover-bg hover:text-fg-default text-fg-muted transition-ink focus-visible:outline-brand flex size-7 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2"
          aria-haspopup="menu"
          aria-label="Actions for {insight.title}"
        >
          <MoreIcon class="size-4" />
        </button>
      {/snippet}

      <div
        class={[MENU_PANEL, 'w-52']}
        role="menu"
        tabindex="-1"
        aria-label="Actions for {insight.title}"
        onkeydown={onMenuArrowKeys}
      >
        <button
          type="button"
          role="menuitem"
          class={MENU_ROW}
          onclick={() => onedit(insight)}
        >
          Edit
        </button>
        <button
          type="button"
          role="menuitem"
          class={[
            MENU_ROW,
            'disabled:text-fg-disabled disabled:pointer-events-none',
          ]}
          disabled={first}
          onclick={() => onmove(insight, -1)}
        >
          Move earlier
        </button>
        <button
          type="button"
          role="menuitem"
          class={[
            MENU_ROW,
            'disabled:text-fg-disabled disabled:pointer-events-none',
          ]}
          disabled={last}
          onclick={() => onmove(insight, 1)}
        >
          Move later
        </button>
        {#each elsewhere as view (view.id)}
          <button
            type="button"
            role="menuitem"
            class={MENU_ROW}
            onclick={() => onviewmove(insight, view)}
          >
            <span class="truncate">Move to {view.name}</span>
          </button>
        {/each}
        <button
          type="button"
          role="menuitem"
          class={[MENU_ROW, 'text-error']}
          onclick={() => onremove(insight)}
        >
          Remove
        </button>
      </div>
    </Dropdown>
  {/snippet}

  {#if tabbed}
    <Tabs size="xs" class="gap-0.5 px-3" aria-label="Charts in {insight.title}">
      {#each charts as chart, index (index)}
        <Tab active={index === active} onclick={() => onTab(index)}>
          {chart.title}
        </Tab>
      {/each}
    </Tabs>
  {/if}

  {#each charts as chart, index (index)}
    {#if index === active || visited.includes(index)}
      <div
        class={['flex flex-1 flex-col', { hidden: index !== active }]}
        role={tabbed ? 'tabpanel' : undefined}
      >
        <InsightBody
          {clusterId}
          {chart}
          {revision}
          bind:summary={summaries[index]}
        />
      </div>
    {/if}
  {/each}
</Well>
