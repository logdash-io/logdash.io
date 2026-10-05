<script lang="ts">
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatPercent } from '../../domain/analytics-format';
  import type {
    WebAnalyticsCohort,
    WebAnalyticsRange,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';

  type Props = {
    clusterId: string;
    range: WebAnalyticsRange;
  };

  const { clusterId, range }: Props = $props();

  const retention = new WebAnalyticsInsightState<WebAnalyticsCohort[]>(() =>
    WebAnalyticsService.readRetention(clusterId, range),
  );

  $effect(() => {
    void range;
    void untrack(() => retention.load());
  });

  function shade(rate: number): string {
    if (rate >= 50) return 'bg-heat-3 text-fg-inverse';
    if (rate >= 25) return 'bg-heat-2 text-fg-default';
    if (rate >= 10) return 'bg-heat-1 text-fg-default';
    return 'bg-heat-0 text-fg-tertiary';
  }
</script>

{#if retention.loading && !retention.data}
  <div class="flex flex-1 items-center justify-center py-16"><Spinner /></div>
{:else if retention.error}
  <p class="text-error py-10 text-center text-sm" role="alert">
    {retention.error}
  </p>
{:else if !retention.data?.length}
  <p
    class="text-fg-muted flex flex-1 items-center justify-center py-16 text-sm"
  >
    No new visitors in this period
  </p>
{:else}
  <p class="text-fg-muted px-3 pb-2 text-xs">
    New visitors grouped by their first day, and the share who came back exactly
    1, 7 and 30 days later.
  </p>
  <div class="max-h-96 overflow-auto">
    <table
      class="w-full min-w-[28rem] border-separate border-spacing-1 text-sm"
    >
      <thead class="text-fg-muted text-xs">
        <tr>
          <th scope="col" class="px-2 pb-1 text-left font-normal">
            First visit
          </th>
          <th scope="col" class="px-2 pb-1 text-right font-normal">Visitors</th>
          <th scope="col" class="w-24 pb-1 text-center font-normal">Day 1</th>
          <th scope="col" class="w-24 pb-1 text-center font-normal">Day 7</th>
          <th scope="col" class="w-24 pb-1 text-center font-normal">Day 30</th>
        </tr>
      </thead>
      <tbody>
        {#each retention.data as cohort (cohort.date)}
          <tr>
            <th scope="row" class="px-2 py-1.5 text-left font-normal">
              {DateTime.fromISO(cohort.date).toFormat('EEE, d LLL')}
            </th>
            <td class="px-2 py-1.5 text-right tabular-nums">
              {cohort.visitors}
            </td>
            {#each [cohort.day1, cohort.day7, cohort.day30] as rate, index (index)}
              <td
                class={[
                  'rounded-md py-1.5 text-center text-xs tabular-nums',
                  rate === null ? 'text-fg-faint' : shade(rate),
                ]}
              >
                {rate === null ? '–' : formatPercent(rate)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
