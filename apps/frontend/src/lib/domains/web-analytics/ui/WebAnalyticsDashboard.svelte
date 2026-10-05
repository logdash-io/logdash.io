<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import ServiceHealthStrip from '$lib/domains/app/clusters/ui/ServiceHealthStrip.svelte';
  import DomainSetupCard from '$lib/domains/app/clusters/ui/DomainSetup/DomainSetupCard.svelte';
  import {
    SETTINGS_PAGE_CLASS,
    SETTINGS_PANEL_CLASS,
    SettingsCardHeader,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { onMount, untrack } from 'svelte';
  import { WebAnalyticsDashboardState } from '../application/web-analytics-dashboard.state.svelte';
  import {
    analyticsSearch,
    parseAnalyticsQuery,
    queryWindow,
    withFilter,
    type AnalyticsQuery,
  } from '../domain/analytics-query';
  import type {
    WebAnalyticsFilter,
    WebAnalyticsRange,
  } from '../domain/web-analytics';
  import AnalyticsToolbar from './AnalyticsToolbar.svelte';
  import ActiveFilters from './ActiveFilters.svelte';
  import MetricsCard from './MetricsCard.svelte';
  import BreakdownCard from './breakdown/BreakdownCard.svelte';
  import GoalsCard from './insights/GoalsCard.svelte';
  import InsightsCard from './insights/InsightsCard.svelte';
  import VisitorsCard from './insights/VisitorsCard.svelte';
  import WebAnalyticsSetup from './WebAnalyticsSetup.svelte';

  type Props = { clusterId: string };
  const { clusterId }: Props = $props();

  const analytics = new WebAnalyticsDashboardState(untrack(() => clusterId));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const query = $derived(parseAnalyticsQuery(page.url.searchParams));
  const timeWindow = $derived(queryWindow(query));
  const range = $derived(rangeOf(query));
  const report = $derived(analytics.report);

  $effect(() => topBarState.show(toolbar));

  $effect(() => {
    const current = range;
    void untrack(() => analytics.load(current));
  });

  onMount(() => {
    void analytics.loadSite();
    const timer = setInterval(() => {
      if (document.hidden || analytics.loading) return;
      void analytics.load(rangeOf(query));
      if (analytics.waitingForData) void analytics.loadSite();
    }, 60_000);
    return () => clearInterval(timer);
  });

  function rangeOf(current: AnalyticsQuery): WebAnalyticsRange {
    const { from, to } = queryWindow(current);
    return {
      from,
      to,
      granularity: current.granularity,
      tz,
      filters: current.filters,
      compare: current.compare,
    };
  }

  function onQueryChange(next: AnalyticsQuery): void {
    void goto(resolve(`/app/domains/${clusterId}${analyticsSearch(next)}`), {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  function onFilter(filter: WebAnalyticsFilter): void {
    onQueryChange(withFilter(query, filter));
  }

  function onRefresh(): void {
    void analytics.load(rangeOf(query));
    void analytics.loadSite();
  }
</script>

<div class="@container flex w-full flex-col">
  <ServiceHealthStrip {clusterId} />

  {#if page.data.setupOpen}
    <DomainSetupCard {clusterId} />
  {/if}

  {#if query.filters.length}
    <div class="edge-b px-4 py-2">
      <ActiveFilters {query} onchange={onQueryChange} />
    </div>
  {/if}

  {#if analytics.error}
    <p class="text-error edge-b px-4 py-3 text-sm" role="alert">
      {analytics.error}
      {report ? 'Showing the last loaded data.' : ''}
    </p>
  {/if}

  {#if analytics.waitingForData}
    <section class={[SETTINGS_PAGE_CLASS, 'gap-3! edge-b']}>
      <SettingsCardHeader
        title="Start counting visitors"
        description="Add the tracking script to your website. Visits show up here within seconds."
      />
      <div class={['min-w-0', SETTINGS_PANEL_CLASS]}>
        <WebAnalyticsSetup {clusterId} />
      </div>
    </section>
  {/if}

  <div class="flex flex-col gap-2 p-2">
    <MetricsCard {report} {query} loading={analytics.loading && !report} />

    <div class="grid gap-2 @2xl:grid-cols-2 @min-[68.75rem]:grid-cols-3">
      <BreakdownCard
        {clusterId}
        {report}
        {range}
        label="Sources"
        tabs={[
          {
            id: 'channels',
            label: 'Channel',
            filter: 'channel',
            chart: 'donut',
          },
          { id: 'referrers', label: 'Referrer', filter: 'referrer' },
          { id: 'campaigns', label: 'Campaign', filter: 'campaign' },
          { id: 'keywords', label: 'Keyword', filter: 'keyword' },
        ]}
        onfilter={onFilter}
      />
      <BreakdownCard
        {clusterId}
        {report}
        {range}
        label="Pages"
        initial="pages"
        tabs={[
          { id: 'hostnames', label: 'Hostname', filter: 'hostname' },
          { id: 'pages', label: 'Page', filter: 'page' },
          {
            id: 'entryPages',
            label: 'Entry',
            title: 'Entry page',
            filter: 'page',
          },
          {
            id: 'exitPages',
            label: 'Exit',
            title: 'Exit page',
            filter: 'page',
          },
        ]}
        onfilter={onFilter}
      />
      <GoalsCard {report} onfilter={onFilter} />
      <BreakdownCard
        {clusterId}
        {report}
        {range}
        label="Countries"
        tabs={[{ id: 'countries', label: 'Country', filter: 'country' }]}
        onfilter={onFilter}
      />
      <BreakdownCard
        {clusterId}
        {report}
        {range}
        label="Technology"
        tabs={[
          { id: 'browsers', label: 'Browser', filter: 'browser' },
          { id: 'os', label: 'OS', filter: 'os' },
          { id: 'devices', label: 'Device', filter: 'device' },
        ]}
        onfilter={onFilter}
      />
      <VisitorsCard {clusterId} {range} />
    </div>

    <InsightsCard {clusterId} {report} {range} />
  </div>
</div>

{#snippet toolbar()}
  <AnalyticsToolbar
    {query}
    span={timeWindow}
    {report}
    loading={analytics.loading}
    onchange={onQueryChange}
    onrefresh={onRefresh}
  />
{/snippet}
