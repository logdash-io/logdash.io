<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { formatCount } from '../../domain/analytics-format';
  import { visitsLabel } from '../../domain/analytics-period';
  import type {
    WebAnalyticsAppRow,
    WebAnalyticsFilter,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';
  import DashboardCard from '../breakdown/DashboardCard.svelte';
  import { CARD_COLUMNS, CARD_ROWS } from '../breakdown/dashboard-card';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import GoalsView from './GoalsView.svelte';

  type Props = {
    report: WebAnalyticsReport | null;
    selected: string | null;
    onselect: (name: string) => void;
    onfilter: (filter: WebAnalyticsFilter) => void;
  };

  type Tab = 'goals' | 'apps';

  const { report, selected, onselect, onfilter }: Props = $props();

  let tab = $state<Tab>('goals');
  let detailsOpen = $state(false);

  const apps = $derived(report?.apps ?? []);
  const hasApps = $derived(apps.some((app) => !app.website));
  const shown = $derived(hasApps ? tab : 'goals');
  const peak = $derived(Math.max(1, ...apps.map((app) => app.visitors)));

  function onTab(value: Tab): void {
    tab = value;
  }

  function onApp(app: WebAnalyticsAppRow): void {
    onfilter({ dimension: 'app', value: app.name });
  }

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }

  function onDetailsSelect(name: string): void {
    detailsOpen = false;
    onselect(name);
  }
</script>

<DashboardCard
  label="Goals"
  tabs={hasApps ? tabSwitch : undefined}
  expandLabel="Show all goals"
  onexpand={shown === 'goals' && report?.breakdowns.goals.length
    ? onDetails
    : undefined}
>
  {#if shown === 'goals'}
    <GoalsView {report} limit={CARD_ROWS} {selected} {onselect} />
  {:else}
    <div class={CARD_COLUMNS}>
      <span>App</span>
      <span class="flex gap-6">
        <span class="w-16 text-right">
          {report ? visitsLabel(report.from, report.to) : 'Visitors'}
        </span>
        <span class="w-16 text-right">People</span>
      </span>
    </div>
    <ul class="flex flex-col gap-0.5">
      {#each apps.slice(0, CARD_ROWS) as app (app.name)}
        <li>
          <button
            type="button"
            class="group focus-visible:outline-brand relative flex h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline-2"
            title="Filter by visitors who used {app.name}"
            onclick={() => onApp(app)}
          >
            <span
              class="bg-surface-150-bg group-hover:bg-surface-150-hover-bg absolute inset-y-0 left-0 rounded-lg"
              style:width="{Math.max(1.5, (app.visitors / peak) * 100)}%"
              aria-hidden="true"
            ></span>
            <span class="relative flex min-w-0 flex-1 items-center gap-2">
              {#if app.website}
                <BreakdownLabel dimension="hostnames" name={app.name} />
              {:else}
                <span class="truncate">{app.name}</span>
              {/if}
            </span>
            <span class="relative flex shrink-0 gap-6 tabular-nums">
              <span class="w-16 text-right font-medium">
                {formatCount(app.visitors)}
              </span>
              <span class="text-fg-tertiary w-16 text-right">
                {formatCount(app.people)}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</DashboardCard>

<DetailsDialog
  isOpen={detailsOpen}
  title="Goals"
  class="max-w-xl"
  onclose={onDetailsClose}
>
  <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
    <GoalsView {report} {selected} onselect={onDetailsSelect} />
  </div>
</DetailsDialog>

{#snippet tabSwitch()}
  <SegmentedControl
    size="xs"
    label="Goals"
    options={[
      { value: 'goals', label: 'Goals' },
      { value: 'apps', label: 'Apps' },
    ]}
    value={shown}
    onChange={onTab}
  />
{/snippet}
