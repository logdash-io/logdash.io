<script lang="ts">
  import { resolve } from '$app/paths';
  import { clusterPulseState } from '$lib/domains/app/clusters/application/cluster-pulse.state.svelte.js';
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
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_PRIMARY,
  } from '$lib/domains/shared/ui/components/toolbar.js';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
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
  import { Dropdown } from '@logdash/hyper-ui/presentational';
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
  const periodName = $derived(
    PERIODS.find(({ id }) => id === period)?.label ?? '',
  );
  const periodLabel = $derived(periodName.toLowerCase());
  const orderName = $derived(
    ORDERS.find(({ id }) => id === order)?.label ?? '',
  );

  $effect(() => topBarState.show(toolbar));

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

<div class="@container flex w-full flex-col gap-2 p-2">
  <p
    class="text-fg-tertiary px-5 pt-6 pb-4 text-xl leading-9 tracking-tight @2xl:pt-8 @2xl:text-2xl"
  >
    Hey {greetingName}, you got
    {#if isLoading}
      <span
        class="bg-surface-150-bg inline-block h-6 w-12 rounded-md align-middle"
        aria-label="Loading"
      ></span>
    {:else}
      <span class="text-fg-default font-mono tabular-nums">
        {formatCount(total)}
      </span>
    {/if}
    {total === 1 && !isLoading ? 'visitor' : 'visitors'}
    {period === 'today' ? '' : 'in the'}
    {periodLabel}
  </p>

  {#if sorted.length}
    <ul
      class="grid grid-cols-1 gap-2 @2xl:grid-cols-2 @min-[68.75rem]:grid-cols-3"
      aria-label="Domains"
    >
      {#each sorted as cluster (cluster.id)}
        <li class="flex min-w-0">
          <DomainCard
            {cluster}
            visitors={visitors[cluster.id] ?? { status: 'loading' }}
            down={clusterPulseState.down(cluster.id)}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <Well label="Domains">
      <EmptyState
        centered
        title="No domains yet"
        description="Add your website to see its visitors here."
      />
    </Well>
  {/if}
</div>

{#snippet toolbar()}
  <div class="flex flex-wrap items-center gap-2">
    {@render periodPicker()}
    {@render orderPicker()}

    {#if clustersState.canAddDomain}
      <a href={resolve('/app/domains/new')} class={TOOLBAR_PRIMARY}>
        <PlusIcon class="size-4" />
        Domain
      </a>
    {:else}
      <button
        type="button"
        class={TOOLBAR_PRIMARY}
        onclick={() => upgradeState.openModal('cluster-limit')}
      >
        <PlusIcon class="size-4" />
        Domain
      </button>
    {/if}
  </div>
{/snippet}

{#snippet periodPicker()}
  <Dropdown align="end">
    {#snippet trigger(attrs)}
      <button
        {...attrs}
        type="button"
        class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
        aria-haspopup="menu"
        aria-label="Period: {periodName}"
      >
        {periodName}
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
      <button
        {...attrs}
        type="button"
        class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
        aria-haspopup="menu"
        aria-label="Order: {orderName}"
      >
        <SortIcon class="size-3.5" />
        <span class="max-sm:hidden">{orderName}</span>
      </button>
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
