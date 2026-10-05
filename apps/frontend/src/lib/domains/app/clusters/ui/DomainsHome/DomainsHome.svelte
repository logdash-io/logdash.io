<script lang="ts">
  import { resolve } from '$app/paths';
  import { clusterHealthState } from '$lib/domains/app/clusters/application/cluster-health.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
  import {
    MENU_PANEL,
    MENU_ROW,
    onMenuArrowKeys,
  } from '$lib/domains/app/clusters/ui/menu.js';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import SortIcon from '$lib/domains/shared/icons/SortIcon.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { formatCount } from '$lib/domains/web-analytics/domain/analytics-format.js';
  import {
    ANALYTICS_PERIODS,
    analyticsWindow,
    defaultGranularity,
    type AnalyticsPeriod,
  } from '$lib/domains/web-analytics/domain/analytics-period.js';
  import { WebAnalyticsService } from '$lib/domains/web-analytics/infrastructure/web-analytics.service.js';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import { Button, Dropdown } from '@logdash/hyper-ui/presentational';
  import { onMount } from 'svelte';
  import { match } from 'ts-pattern';
  import DomainCard from './DomainCard.svelte';
  import type { DomainVisitors } from './domain-visitors';

  type HomeOrder = 'visitors' | 'name' | 'recent';

  const PERIOD_KEY = 'ld-home-period';
  const ORDER_KEY = 'ld-home-order';
  const PERIOD_IDS: AnalyticsPeriod[] = ['today', '24h', '7d', '30d', '12m'];
  const PERIODS = ANALYTICS_PERIODS.filter(({ id }) => PERIOD_IDS.includes(id));
  const ORDERS: { id: HomeOrder; label: string }[] = [
    { id: 'visitors', label: 'Most visitors' },
    { id: 'name', label: 'Name' },
    { id: 'recent', label: 'Recently added' },
  ];

  let period = $state<AnalyticsPeriod>('7d');
  let order = $state<HomeOrder>('visitors');
  let restored = $state(false);
  let visitors = $state<Record<string, DomainVisitors>>({});
  let generation = 0;

  const clusters = $derived(clustersState.clusters);
  const clusterIds = $derived(clusters.map(({ id }) => id).join(','));
  const sorted = $derived(sortClusters(clusters, order));
  const greetingName = $derived(
    userState.isAnonymous
      ? 'there'
      : userState.user?.email?.split('@')[0] || 'there',
  );
  const isLoading = $derived(
    clusters.some(
      ({ id }) => (visitors[id]?.status ?? 'loading') === 'loading',
    ),
  );
  const total = $derived(
    clusters.reduce((sum, { id }) => sum + countOf(visitors[id]), 0),
  );
  const periodLabel = $derived(
    PERIODS.find(({ id }) => id === period)?.label.toLowerCase() ?? '',
  );

  $effect(() => topBarState.show(actions));

  onMount(() => {
    period = readStored(PERIOD_KEY, PERIOD_IDS) ?? period;
    order =
      readStored(
        ORDER_KEY,
        ORDERS.map(({ id }) => id),
      ) ?? order;
    restored = true;
  });

  $effect(() => {
    if (!restored) {
      return;
    }

    void loadVisitors(clusterIds ? clusterIds.split(',') : [], period);
  });

  async function loadVisitors(
    ids: string[],
    selected: AnalyticsPeriod,
  ): Promise<void> {
    const current = ++generation;
    const window = analyticsWindow(selected, 0);
    const range = {
      from: window.from,
      to: window.to,
      granularity: defaultGranularity(selected),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      filters: [],
      compare: false,
    };

    visitors = Object.fromEntries(ids.map((id) => [id, { status: 'loading' }]));

    await Promise.all(
      ids.map(async (id) => {
        const result = await readVisitors(id, range);

        if (current === generation) {
          visitors[id] = result;
        }
      }),
    );
  }

  async function readVisitors(
    id: string,
    range: Parameters<typeof WebAnalyticsService.readOverview>[1],
  ): Promise<DomainVisitors> {
    try {
      const overview = await WebAnalyticsService.readOverview(id, range);
      return { status: 'ready', overview };
    } catch {
      return { status: 'error' };
    }
  }

  function sortClusters(list: Cluster[], by: HomeOrder): Cluster[] {
    const byName = (a: Cluster, b: Cluster): number =>
      a.name.localeCompare(b.name);

    return match(by)
      .with('name', () => list.toSorted(byName))
      .with('recent', () => list.toSorted((a, b) => b.id.localeCompare(a.id)))
      .with('visitors', () =>
        list.toSorted(
          (a, b) =>
            countOf(visitors[b.id]) - countOf(visitors[a.id]) || byName(a, b),
        ),
      )
      .exhaustive();
  }

  function countOf(entry: DomainVisitors | undefined): number {
    return entry?.status === 'ready' ? entry.overview.visitors : 0;
  }

  function downCount(clusterId: string): number {
    return clusterHealthState
      .getMonitors(clusterId)
      .filter(({ lastStatus }) => lastStatus === 'down').length;
  }

  function onPeriodSelect(id: AnalyticsPeriod): void {
    period = id;
    localStorage.setItem(PERIOD_KEY, id);
  }

  function onOrderSelect(id: HomeOrder): void {
    order = id;
    localStorage.setItem(ORDER_KEY, id);
  }

  function readStored<T extends string>(key: string, allowed: T[]): T | null {
    const value = localStorage.getItem(key);
    return allowed.find((id) => id === value) ?? null;
  }
</script>

<div class="flex w-full flex-col">
  <div class="px-4 py-8 sm:px-6 sm:py-10">
    <div class="text-fg-tertiary text-xl leading-9 tracking-tight sm:text-2xl">
      Hey {greetingName}, you got
      {#if isLoading}
        <span
          class="bg-surface-150-bg inline-block h-6 w-12 rounded align-middle"
          aria-label="Loading"
        ></span>
      {:else}
        <span class="text-fg-default font-mono tabular-nums">
          {formatCount(total)}
        </span>
      {/if}
      {total === 1 && !isLoading ? 'visitor' : 'visitors'}
      {period === 'today' ? '' : 'in the'}
      {@render periodPicker()}
    </div>
  </div>

  {#if sorted.length}
    <ul
      class="grid gap-2 px-2 pb-2 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Domains"
    >
      {#each sorted as cluster (cluster.id)}
        <li class="flex">
          <DomainCard
            {cluster}
            visitors={visitors[cluster.id] ?? { status: 'loading' }}
            down={downCount(cluster.id)}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <EmptyState
      class="p-10"
      title="No domains yet"
      description="Add your website to see its visitors here."
    />
  {/if}
</div>

{#snippet actions()}
  {@render orderPicker()}

  {#if clustersState.canAddDomain}
    <Button href={resolve('/app/domains/new')} variant="primary" size="sm">
      <PlusIcon class="size-4" />
      Domain
    </Button>
  {:else}
    <Button
      variant="primary"
      size="sm"
      onclick={() => upgradeState.openModal('cluster-limit')}
    >
      <PlusIcon class="size-4" />
      Domain
    </Button>
  {/if}
{/snippet}

{#snippet periodPicker()}
  <Dropdown>
    {#snippet trigger(attrs)}
      <button
        {...attrs}
        type="button"
        class="text-fg-default focus-visible:outline-brand inline-flex cursor-pointer items-center gap-1 rounded-sm underline decoration-fg-faint decoration-dashed underline-offset-[6px] focus-visible:outline-2"
        aria-haspopup="menu"
      >
        {periodLabel}
        <ChevronDownIcon class="size-3.5 text-fg-muted" />
      </button>
    {/snippet}

    <div
      class={[MENU_PANEL, 'w-48']}
      role="menu"
      tabindex="-1"
      aria-label="Period"
      onkeydown={onMenuArrowKeys}
    >
      {#each PERIODS as option (option.id)}
        {@render choice(option.label, option.id === period, () =>
          onPeriodSelect(option.id),
        )}
      {/each}
    </div>
  </Dropdown>
{/snippet}

{#snippet orderPicker()}
  <Dropdown align="end">
    {#snippet trigger(attrs)}
      <Button {...attrs} variant="ghost" size="sm" aria-haspopup="menu">
        <SortIcon class="size-4" />
        Order
      </Button>
    {/snippet}

    <div
      class={[MENU_PANEL, 'w-48']}
      role="menu"
      tabindex="-1"
      aria-label="Order"
      onkeydown={onMenuArrowKeys}
    >
      {#each ORDERS as option (option.id)}
        {@render choice(option.label, option.id === order, () =>
          onOrderSelect(option.id),
        )}
      {/each}
    </div>
  </Dropdown>
{/snippet}

{#snippet choice(label: string, selected: boolean, onclick: () => void)}
  <button
    type="button"
    role="menuitemradio"
    aria-checked={selected}
    class={[
      MENU_ROW,
      selected
        ? 'bg-surface-elevated-selected-bg text-fg-default'
        : 'text-fg-secondary',
    ]}
    {onclick}
  >
    <span class="flex-1 truncate">{label}</span>
    {#if selected}
      <CheckIcon class="size-4 shrink-0" />
    {/if}
  </button>
{/snippet}
