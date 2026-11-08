<script lang="ts">
  import { DateTime } from 'luxon';
  import { formatCount } from '../../domain/analytics-format';
  import type {
    WebAnalyticsInsightBucket,
    WebAnalyticsInsightCohort,
    WebAnalyticsInsightEvent,
  } from '../../domain/web-analytics';
  import { commonPrefix } from '../../domain/web-analytics-insight';
  import HeatCell from './HeatCell.svelte';
  import InsightEventName from './InsightEventName.svelte';

  type Props = {
    cohorts: WebAnalyticsInsightCohort[];
    events: WebAnalyticsInsightEvent[];
    bucket: WebAnalyticsInsightBucket;
    property: string;
  };

  const { cohorts, events, bucket, property }: Props = $props();

  const prefix = $derived(commonPrefix(events.map((event) => event.name)));

  function cohortLabel(cohort: string): string {
    const date = DateTime.fromISO(cohort);
    if (bucket === 'month') return date.toFormat('LLL yyyy');
    if (bucket === 'week') return `Week of ${date.toFormat('d LLL')}`;
    return date.toFormat('EEE, d LLL');
  }
</script>

{#if !cohorts.length}
  <p
    class="text-fg-muted flex flex-1 items-center justify-center py-16 text-sm"
  >
    No events with a {property} date in this period
  </p>
{:else}
  <div class="max-h-96 overflow-auto">
    <table class="w-full border-separate border-spacing-1 text-sm">
      <thead class="text-fg-muted bg-surface-25-bg sticky top-0 text-xs">
        <tr>
          <th scope="col" class="px-2 pb-1 text-left align-bottom font-normal">
            Cohort
          </th>
          {#each events as event, index (index)}
            <th
              scope="col"
              class={[
                'min-w-20 pb-1 align-bottom font-normal',
                index ? 'text-center' : 'px-2 text-right',
              ]}
            >
              <InsightEventName
                name={event.name}
                {prefix}
                filters={event.filters}
                wrap
              />
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each cohorts as cohort (cohort.cohort)}
          <tr>
            <th
              scope="row"
              class="px-2 py-1.5 text-left font-normal whitespace-nowrap"
            >
              {cohortLabel(cohort.cohort)}
            </th>
            <td class="px-2 py-1.5 text-right tabular-nums">
              {formatCount(cohort.counts[0] ?? 0)}
            </td>
            {#each cohort.shares.slice(1) as share, index (index)}
              <HeatCell
                rate={share}
                title="{formatCount(cohort.counts[index + 1] ?? 0)} events"
              />
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
