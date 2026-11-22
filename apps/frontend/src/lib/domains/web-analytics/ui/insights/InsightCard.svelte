<script lang="ts">
  import {
    MENU_PANEL,
    MENU_ROW,
    onMenuArrowKeys,
  } from '$lib/domains/app/clusters/ui/menu';
  import EyeOffIcon from '$lib/domains/shared/icons/EyeOffIcon.svelte';
  import MoreIcon from '$lib/domains/shared/icons/MoreIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { Dropdown, Tab, Tabs } from '@logdash/hyper-ui/presentational';
  import { match } from 'ts-pattern';
  import type {
    WebAnalyticsChartType,
    WebAnalyticsInsight,
    WebAnalyticsView,
  } from '../../domain/web-analytics';
  import { insightCharts } from '../../domain/web-analytics-insight';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import { fitRows, type RowFit } from '../breakdown/fit-rows';
  import MoreRow from '../breakdown/MoreRow.svelte';
  import InsightBody from './InsightBody.svelte';

  type Props = {
    clusterId: string;
    insight: WebAnalyticsInsight;
    revision: number;
    elsewhere: WebAnalyticsView[];
    onedit: (insight: WebAnalyticsInsight) => void;
    onviewmove: (insight: WebAnalyticsInsight, view: WebAnalyticsView) => void;
    onhide: (insight: WebAnalyticsInsight) => void;
    onremove: (insight: WebAnalyticsInsight) => void;
  };

  const {
    clusterId,
    insight,
    revision,
    elsewhere,
    onedit,
    onviewmove,
    onhide,
    onremove,
  }: Props = $props();

  const charts = $derived(insightCharts(insight));
  const tabbed = $derived(insight.type === 'tabs');

  let picked = $state(0);
  let visited = $state([0]);
  let summaries = $state<string[]>([]);
  let fits = $state<RowFit[]>([]);
  let detailsOpen = $state(false);

  const active = $derived(Math.min(picked, charts.length - 1));
  const summary = $derived(summaries[active] ?? '');

  function onTab(index: number): void {
    picked = index;
    if (!visited.includes(index)) visited.push(index);
  }

  function onFit(index: number, next: RowFit): void {
    fits[index] = next;
  }

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }

  function rowsOf(type: WebAnalyticsChartType): string {
    return match(type)
      .with('funnel', () => 'steps')
      .with('trend', () => 'events')
      .with('cohorts', () => 'cohorts')
      .otherwise(() => 'rows');
  }
</script>

<Well label={insight.title} class="group/card @container h-full">
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
      <IconButton
        well
        label="Hide {insight.title}"
        onclick={() => onhide(insight)}
      >
        <EyeOffIcon class="size-4" />
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
      {@const fit = fits[index]}
      <div
        class={[
          'relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden',
          { hidden: index !== active },
        ]}
        role={tabbed ? 'tabpanel' : undefined}
        {@attach fitRows((next) => onFit(index, next))}
      >
        <InsightBody
          {clusterId}
          {chart}
          {revision}
          bind:summary={summaries[index]}
        />
        {#if fit?.more}
          <MoreRow
            shown={fit.shown}
            total={fit.shown + fit.hidden}
            label={rowsOf(chart.type)}
            onopen={onDetails}
          />
        {/if}
      </div>
    {/if}
  {/each}
</Well>

<DetailsDialog
  isOpen={detailsOpen}
  title={charts[active]?.title ?? insight.title}
  class="max-w-4xl"
  onclose={onDetailsClose}
>
  <div
    class="@container flex h-[34rem] max-h-[70dvh] min-h-0 flex-col overflow-y-auto px-3 pt-3 pb-4"
  >
    {#if charts[active]}
      <InsightBody {clusterId} chart={charts[active]} {revision} />
    {/if}
  </div>
</DetailsDialog>
