<script lang="ts">
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import MenuIcon from '$lib/domains/shared/icons/MenuIcon.svelte';
  import PieChartIcon from '$lib/domains/shared/icons/PieChartIcon.svelte';
  import type {
    WebAnalyticsBreakdownName,
    WebAnalyticsBreakdownRow,
    WebAnalyticsFilter,
    WebAnalyticsFilterDimension,
    WebAnalyticsRange,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import BreakdownDialog from './BreakdownDialog.svelte';
  import BreakdownList from './BreakdownList.svelte';
  import ChannelDonut from './ChannelDonut.svelte';
  import DashboardCard from './DashboardCard.svelte';
  import { CARD_COLUMNS, CARD_ROWS } from './dashboard-card';

  type BreakdownTab = {
    id: WebAnalyticsBreakdownName;
    label: string;
    title?: string;
    filter: WebAnalyticsFilterDimension;
    chart?: 'donut';
  };

  type Props = {
    clusterId: string;
    report: WebAnalyticsReport | null;
    range: WebAnalyticsRange;
    label: string;
    tabs: BreakdownTab[];
    initial?: WebAnalyticsBreakdownName;
    onfilter: (filter: WebAnalyticsFilter) => void;
  };

  const { clusterId, report, range, label, tabs, initial, onfilter }: Props =
    $props();

  let selected = $state<WebAnalyticsBreakdownName | null>(null);
  let detailsOpen = $state(false);
  let donut = $state(false);

  const tab = $derived(
    tabs.find((entry) => entry.id === (selected ?? initial)) ?? tabs[0],
  );
  const title = $derived(tab.title ?? tab.label);
  const rows = $derived(report?.breakdowns[tab.id] ?? []);

  function onSelect(row: WebAnalyticsBreakdownRow): void {
    onfilter({ dimension: tab.filter, value: row.name });
  }

  function onTab(value: WebAnalyticsBreakdownName): void {
    selected = value;
  }

  function onChartToggle(): void {
    donut = !donut;
  }

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsSelect(row: WebAnalyticsBreakdownRow): void {
    detailsOpen = false;
    onSelect(row);
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }
</script>

<DashboardCard
  {label}
  tabs={tabs.length > 1 ? tabSwitch : undefined}
  actions={tab.chart && rows.length ? chartToggle : undefined}
  expandLabel="Show all {title.toLowerCase()} rows"
  onexpand={rows.length ? onDetails : undefined}
>
  {#if !report}
    <div class="flex flex-col gap-0.5 pt-6.5" aria-hidden="true">
      {#each [92, 70, 54, 40, 31, 22, 16, 11] as width (width)}
        <div
          class="bg-surface-150-bg h-8 rounded-lg"
          style:width="{width}%"
        ></div>
      {/each}
    </div>
  {:else if !rows.length}
    <p class="flex h-full items-center justify-center text-sm text-fg-muted">
      No {title.toLowerCase()} data in this period
    </p>
  {:else if tab.chart === 'donut' && donut}
    <div class="flex flex-1 items-center">
      <ChannelDonut {rows} onselect={onSelect} />
    </div>
  {:else}
    <div class={CARD_COLUMNS}>
      <span>{title}</span>
      <span>Visitors</span>
    </div>
    <BreakdownList
      rows={rows.slice(0, CARD_ROWS)}
      dimension={tab.id}
      onselect={onSelect}
    />
  {/if}
</DashboardCard>

<BreakdownDialog
  isOpen={detailsOpen}
  {clusterId}
  {range}
  {title}
  dimension={tab.id}
  onselect={onDetailsSelect}
  onclose={onDetailsClose}
/>

{#snippet tabSwitch()}
  <SegmentedControl
    size="xs"
    {label}
    options={tabs.map((entry) => ({ value: entry.id, label: entry.label }))}
    value={tab.id}
    onChange={onTab}
  />
{/snippet}

{#snippet chartToggle()}
  <IconButton
    label={donut ? 'Show as list' : 'Show as chart'}
    onclick={onChartToggle}
  >
    {#if donut}
      <MenuIcon class="size-3.5" />
    {:else}
      <PieChartIcon class="size-3.5" />
    {/if}
  </IconButton>
{/snippet}
