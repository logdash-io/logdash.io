<script lang="ts">
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import type { AnalyticsQuery } from '../../domain/analytics-query';
  import type {
    WebAnalyticsFilter,
    WebAnalyticsRange,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import BreakdownCard from '../breakdown/BreakdownCard.svelte';
  import EventPanel from '../event/EventPanel.svelte';
  import GoalsCard from '../insights/GoalsCard.svelte';
  import InsightsCard from '../insights/InsightsCard.svelte';

  type Props = {
    clusterId: string;
    report: WebAnalyticsReport | null;
    range: WebAnalyticsRange;
    query: AnalyticsQuery;
    open: boolean;
    onfilter: (filter: WebAnalyticsFilter) => void;
    onevent: (name: string) => void;
    oneventclose: () => void;
  };

  let {
    clusterId,
    report,
    range,
    query,
    open = $bindable(),
    onfilter,
    onevent,
    oneventclose,
  }: Props = $props();
</script>

<details
  class="bg-surface-25-bg group/details @container rounded-2xl"
  bind:open
>
  <summary
    class="hover:text-fg-default focus-visible:outline-brand transition-ink flex h-11 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 text-[13px] font-medium outline-none select-none focus-visible:outline-2 [&::-webkit-details-marker]:hidden"
  >
    <ChevronRightIcon
      class="text-fg-muted size-3.5 transition-transform duration-200 group-open/details:rotate-90"
    />
    Details
    <span class="text-fg-muted truncate font-normal">
      Channels, pages, goals, countries, technology, journeys and retention
    </span>
  </summary>

  {#if open}
    <div class="flex flex-col gap-2 p-2 pt-0">
      {#if query.event}
        {#key query.event}
          <EventPanel
            {clusterId}
            name={query.event}
            {query}
            {range}
            {onfilter}
            onclose={oneventclose}
          />
        {/key}
      {/if}

      <div class="grid gap-2 @2xl:grid-cols-2 @min-[68.75rem]:grid-cols-3">
        <BreakdownCard
          {clusterId}
          {report}
          {range}
          label="Channels"
          tabs={[
            {
              id: 'channels',
              label: 'Channel',
              filter: 'channel',
              chart: 'donut',
            },
            { id: 'campaigns', label: 'Campaign', filter: 'campaign' },
            { id: 'keywords', label: 'Keyword', filter: 'keyword' },
            { id: 'referrers', label: 'Referrer', filter: 'referrer' },
          ]}
          {onfilter}
        />
        <BreakdownCard
          {clusterId}
          {report}
          {range}
          label="Pages"
          tabs={[
            { id: 'pages', label: 'Page', filter: 'page' },
            {
              id: 'exitPages',
              label: 'Exit',
              title: 'Exit page',
              filter: 'page',
            },
            { id: 'hostnames', label: 'Hostname', filter: 'hostname' },
          ]}
          {onfilter}
        />
        <GoalsCard
          {report}
          selected={query.event}
          onselect={onevent}
          {onfilter}
        />
        <BreakdownCard
          {clusterId}
          {report}
          {range}
          label="Countries"
          tabs={[{ id: 'countries', label: 'Country', filter: 'country' }]}
          attribution={dbIpAttribution}
          {onfilter}
        />
        <div class="flex min-w-0 flex-col @2xl:col-span-2">
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
            {onfilter}
          />
        </div>
      </div>
      <InsightsCard {clusterId} {report} {range} />
    </div>
  {/if}
</details>

{#snippet dbIpAttribution()}
  <a
    href="https://db-ip.com"
    target="_blank"
    rel="noopener"
    class="text-fg-muted hover:text-fg-secondary focus-visible:text-fg-secondary focus-visible:outline-brand transition-ink truncate rounded-sm px-1.5 text-[11px] focus-visible:outline-2"
  >
    IP Geolocation by DB-IP
  </a>
{/snippet}
