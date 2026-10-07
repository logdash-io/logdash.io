<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import ServiceHealthStrip from '$lib/domains/app/clusters/ui/ServiceHealthStrip.svelte';
  import { SettingsCardHeader } from '$lib/domains/shared/ui/components/settings-card';
  import { onMount, untrack } from 'svelte';
  import { WebAnalyticsDashboardState } from '../application/web-analytics-dashboard.state.svelte';
  import {
    analyticsRange,
    analyticsSearch,
    parseAnalyticsQuery,
    queryWindow,
    withFilter,
    type AnalyticsQuery,
  } from '../domain/analytics-query';
  import type { WebAnalyticsFilter } from '../domain/web-analytics';
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
  const range = $derived(analyticsRange(query, tz));
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
      void analytics.load(analyticsRange(query, tz));
      if (analytics.waitingForData) void analytics.loadSite();
    }, 60_000);
    return () => clearInterval(timer);
  });

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

  function eventPath(name: string): `/app/domains/${string}` {
    return `/app/domains/${clusterId}/events/${name}${analyticsSearch(query)}`;
  }

  function onRefresh(): void {
    void analytics.load(analyticsRange(query, tz));
    void analytics.loadSite();
  }
</script>

<div class="@container flex w-full flex-col">
  <ServiceHealthStrip {clusterId} />

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

  <div class="grid grid-cols-1">
    <div
      class={[
        'col-start-1 row-start-1 flex flex-col gap-2 p-2',
        {
          'max-h-160 overflow-hidden blur-[2px] select-none [mask-image:linear-gradient(to_bottom,black,transparent)]':
            analytics.waitingForData,
        },
      ]}
      inert={analytics.waitingForData}
    >
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
        <GoalsCard {report} {eventPath} onfilter={onFilter} />
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

    {#if analytics.waitingForData}
      <section
        class="relative z-10 col-start-1 row-start-1 mx-auto w-full max-w-168 self-start px-2 pt-32 pb-10 @xl:px-8"
      >
        <div
          class="bg-surface-elevated-bg edge flex min-w-0 flex-col gap-4 rounded-xl p-5 shadow-2xl"
        >
          <SettingsCardHeader
            title="Start counting visitors"
            description="Add the tracking script to your website. Visits show up here within seconds."
          />
          <WebAnalyticsSetup {clusterId} />
        </div>
      </section>
    {/if}
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
