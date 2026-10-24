<script lang="ts">
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import type { AnalyticsQuery } from '../../domain/analytics-query';
  import type {
    WebAnalyticsEvent,
    WebAnalyticsFilter,
    WebAnalyticsRange,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';
  import EventMetricsCard from './EventMetricsCard.svelte';
  import EventPropertiesCard from './EventPropertiesCard.svelte';

  type Props = {
    clusterId: string;
    name: string;
    query: AnalyticsQuery;
    range: WebAnalyticsRange;
    onfilter: (filter: WebAnalyticsFilter) => void;
    onclose: () => void;
  };

  const { clusterId, name, query, range, onfilter, onclose }: Props = $props();

  const event = new WebAnalyticsInsightState<WebAnalyticsEvent>(() =>
    WebAnalyticsService.readEvent(clusterId, name, range),
  );
  const filtered = $derived(
    query.filters.some(
      (filter) => filter.dimension === 'goal' && filter.value === name,
    ),
  );

  $effect(() => {
    void range;
    untrack(() => void event.load());
  });

  function onGoalFilter(): void {
    onfilter({ dimension: 'goal', value: name });
  }
</script>

{#if event.error}
  <p class="text-error px-2 text-sm" role="alert">
    {event.error}
    {event.data ? 'Showing the last loaded data.' : ''}
  </p>
{/if}

<EventMetricsCard
  {name}
  event={event.data}
  {query}
  loading={event.loading && !event.data}
  onfilter={filtered ? undefined : onGoalFilter}
  {onclose}
/>

<EventPropertiesCard {clusterId} {name} {range} event={event.data} {onfilter} />
