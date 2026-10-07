<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import { onMount, untrack } from 'svelte';
  import {
    WebAnalyticsDashboardState,
    WebAnalyticsInsightState,
  } from '../../application/web-analytics-dashboard.state.svelte';
  import {
    analyticsRange,
    analyticsSearch,
    parseAnalyticsQuery,
    queryWindow,
    withFilter,
    type AnalyticsQuery,
  } from '../../domain/analytics-query';
  import type {
    WebAnalyticsEvent,
    WebAnalyticsFilter,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';
  import ActiveFilters from '../ActiveFilters.svelte';
  import AnalyticsToolbar from '../AnalyticsToolbar.svelte';
  import EventMetricsCard from './EventMetricsCard.svelte';
  import EventPropertiesCard from './EventPropertiesCard.svelte';

  type Props = { clusterId: string; name: string };
  const { clusterId, name }: Props = $props();

  const analytics = new WebAnalyticsDashboardState(untrack(() => clusterId));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const query = $derived(parseAnalyticsQuery(page.url.searchParams));
  const timeWindow = $derived(queryWindow(query));
  const range = $derived(analyticsRange(query, tz));
  const eventReport = new WebAnalyticsInsightState<WebAnalyticsEvent>(() =>
    WebAnalyticsService.readEvent(clusterId, name, range),
  );

  $effect(() => topBarState.show(toolbar));

  $effect(() => {
    const current = range;
    untrack(() => {
      void eventReport.load();
      void analytics.load(current);
    });
  });

  onMount(() => {
    const timer = setInterval(() => {
      if (document.hidden || eventReport.loading) return;
      onRefresh();
    }, 60_000);
    return () => clearInterval(timer);
  });

  function onQueryChange(next: AnalyticsQuery): void {
    void goto(
      resolve(
        `/app/domains/${clusterId}/events/${name}${analyticsSearch(next)}`,
      ),
      { replaceState: true, noScroll: true, keepFocus: true },
    );
  }

  function onFilter(filter: WebAnalyticsFilter): void {
    onQueryChange(withFilter(query, filter));
  }

  function onRefresh(): void {
    void eventReport.load();
    void analytics.load(range);
  }
</script>

<div class="@container flex w-full flex-col">
  {#if query.filters.length}
    <div class="edge-b px-4 py-2">
      <ActiveFilters {query} onchange={onQueryChange} />
    </div>
  {/if}

  {#if eventReport.error}
    <p class="text-error edge-b px-4 py-3 text-sm" role="alert">
      {eventReport.error}
      {eventReport.data ? 'Showing the last loaded data.' : ''}
    </p>
  {/if}

  <div class="flex flex-col gap-2 p-2">
    <EventMetricsCard
      {name}
      event={eventReport.data}
      {query}
      loading={eventReport.loading && !eventReport.data}
    />
    <EventPropertiesCard
      {clusterId}
      {name}
      {range}
      event={eventReport.data}
      onfilter={onFilter}
    />
  </div>
</div>

{#snippet toolbar()}
  <AnalyticsToolbar
    {query}
    span={timeWindow}
    report={analytics.report}
    loading={eventReport.loading}
    onchange={onQueryChange}
    onrefresh={onRefresh}
  />
{/snippet}
