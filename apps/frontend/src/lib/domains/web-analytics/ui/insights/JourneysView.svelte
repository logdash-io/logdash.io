<script lang="ts">
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatCount } from '../../domain/analytics-format';
  import type {
    WebAnalyticsJourney,
    WebAnalyticsRange,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';

  type Props = {
    clusterId: string;
    range: WebAnalyticsRange;
  };

  const { clusterId, range }: Props = $props();

  const journeys = new WebAnalyticsInsightState<WebAnalyticsJourney[]>(() =>
    WebAnalyticsService.readJourneys(clusterId, range),
  );
  const peak = $derived(Math.max(1, journeys.data?.[0]?.sessions ?? 0));

  $effect(() => {
    void range;
    void untrack(() => journeys.load());
  });
</script>

{#if journeys.loading && !journeys.data}
  <div class="flex flex-1 items-center justify-center py-16"><Spinner /></div>
{:else if journeys.error}
  <p class="text-error py-10 text-center text-sm" role="alert">
    {journeys.error}
  </p>
{:else if !journeys.data?.length}
  <p
    class="text-fg-muted flex flex-1 items-center justify-center py-16 text-sm"
  >
    No multi-page sessions in this period
  </p>
{:else}
  <div
    class="text-fg-muted flex items-center justify-between px-3 pt-1 pb-2 text-xs"
  >
    <span>Most common paths through your site, first five pages</span>
    <span>Sessions</span>
  </div>
  <ol class="flex flex-col gap-0.5">
    {#each journeys.data as journey (journey.steps.join(' '))}
      <li
        class="relative flex min-h-9 items-center gap-3 rounded-lg px-3 py-1.5 text-sm"
      >
        <span
          class="bg-surface-150-bg absolute inset-y-0 left-0 rounded-lg"
          style:width="{Math.max(1.5, (journey.sessions / peak) * 100)}%"
          aria-hidden="true"
        ></span>
        <span class="relative flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {#each journey.steps as step, index (index)}
            {#if index > 0}
              <ChevronRightIcon class="size-3 shrink-0 text-fg-muted" />
            {/if}
            <span class="max-w-48 truncate">{step}</span>
          {/each}
        </span>
        <span class="relative shrink-0 font-medium tabular-nums">
          {formatCount(journey.sessions)}
        </span>
      </li>
    {/each}
  </ol>
{/if}
