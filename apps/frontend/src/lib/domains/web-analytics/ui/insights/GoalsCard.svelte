<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { formatCount } from '../../domain/analytics-format';
  import type {
    WebAnalyticsAppRow,
    WebAnalyticsFilter,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';
  import DashboardCard from '../breakdown/DashboardCard.svelte';
  import { CARD_COLUMNS, REPORT_ROWS } from '../breakdown/dashboard-card';
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
  const hasGoals = $derived(
    !!(report?.goals.length || report?.breakdowns.goals.length),
  );

  function onTab(value: Tab): void {
    tab = value;
  }

  function onApp(app: WebAnalyticsAppRow): void {
    detailsOpen = false;
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
  expandLabel={shown === 'goals' ? 'Show all goals' : 'Show all apps'}
  onexpand={(shown === 'goals' ? hasGoals : apps.length)
    ? onDetails
    : undefined}
  more={shown === 'goals' ? 'events' : 'apps'}
  total={shown === 'goals' &&
  (report?.breakdowns.goals.length ?? 0) >= REPORT_ROWS
    ? null
    : undefined}
>
  {#if shown === 'goals'}
    <GoalsView {report} compact {selected} {onselect} />
  {:else}
    {@render appList()}
  {/if}
</DashboardCard>

<DetailsDialog
  isOpen={detailsOpen}
  title={shown === 'goals' ? 'Goals' : 'Apps'}
  class="max-w-xl"
  onclose={onDetailsClose}
>
  <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
    {#if shown === 'goals'}
      <GoalsView {report} {selected} onselect={onDetailsSelect} />
    {:else}
      {@render appList()}
    {/if}
  </div>
</DetailsDialog>

{#snippet appList()}
  <div class={CARD_COLUMNS}>
    <span>App</span>
    <span class="flex gap-6">
      <span class="w-16 text-right">Visits</span>
      <span class="w-16 text-right">People</span>
    </span>
  </div>
  <ul class="flex flex-col gap-0.5">
    {#each apps as app (app.name)}
      <li data-row>
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
{/snippet}

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
