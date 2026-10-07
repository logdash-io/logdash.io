<script lang="ts">
  import CodeBlock from '$lib/landing/guides/blocks/CodeBlock.svelte';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import type {
    WebAnalyticsRange,
    WebAnalyticsRetention,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';

  type Props = {
    clusterId: string;
    range: WebAnalyticsRange;
  };

  const { clusterId, range }: Props = $props();

  const IDENTIFY_CODE = [
    'window.logdash?.identify(user.id);',
    'window.logdash?.identify(null);',
  ].join('\n');

  const retention = new WebAnalyticsInsightState<WebAnalyticsRetention>(() =>
    WebAnalyticsService.readRetention(clusterId, range),
  );

  const identified = $derived(
    Boolean(
      retention.data?.cohorts.length ||
        retention.data?.stickiness.dailyActive ||
        retention.data?.stickiness.monthlyActive,
    ),
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
{:else if !retention.data || !identified}
  {@render setup()}
{:else}
  {@const { cohorts, stickiness, comebacks }: WebAnalyticsRetention =
    retention.data}
  <dl class="grid grid-cols-2 gap-2 pb-2 @md:grid-cols-4">
    <div class="flex min-w-0 flex-col gap-1.5 rounded-lg p-3">
      <dt class="text-fg-muted text-xs">Stickiness</dt>
      <dd class="font-mono text-2xl tabular-nums">
        {stickiness.ratio === null ? '–' : formatPercent(stickiness.ratio)}
      </dd>
      <dd class="text-fg-muted text-xs tabular-nums">
        {formatCount(stickiness.dailyActive)} daily /
        {formatCount(stickiness.monthlyActive)} monthly users
      </dd>
    </div>
    {#each comebacks as comeback (comeback.minDays)}
      <div class="flex min-w-0 flex-col gap-1.5 rounded-lg p-3">
        <dt class="text-fg-muted text-xs">
          Back after {comeback.minDays}+ days
        </dt>
        <dd class="font-mono text-2xl tabular-nums">
          {formatCount(comeback.users)}
        </dd>
      </div>
    {/each}
  </dl>

  {#if !cohorts.length}
    <p
      class="text-fg-muted flex flex-1 items-center justify-center py-16 text-sm"
    >
      No new signed-in users in this period
    </p>
  {:else}
    <p class="text-fg-muted px-3 pb-2 text-xs">
      Signed-in users grouped by their first day, and the share who came back
      exactly 1, 7, 30 and 90 days later.
    </p>
    <div class="max-h-96 overflow-auto">
      <table
        class="w-full min-w-[34rem] border-separate border-spacing-1 text-sm"
      >
        <thead class="text-fg-muted bg-surface-25-bg sticky top-0 text-xs">
          <tr>
            <th scope="col" class="px-2 pb-1 text-left font-normal">
              First seen
            </th>
            <th scope="col" class="px-2 pb-1 text-right font-normal">Users</th>
            <th scope="col" class="w-24 pb-1 text-center font-normal">Day 1</th>
            <th scope="col" class="w-24 pb-1 text-center font-normal">Day 7</th>
            <th scope="col" class="w-24 pb-1 text-center font-normal">
              Day 30
            </th>
            <th scope="col" class="w-24 pb-1 text-center font-normal">
              Day 90
            </th>
          </tr>
        </thead>
        <tbody>
          {#each cohorts as cohort (cohort.date)}
            <tr>
              <th
                scope="row"
                class="px-2 py-1.5 text-left font-normal whitespace-nowrap"
              >
                {DateTime.fromISO(cohort.date).toFormat('EEE, d LLL')}
              </th>
              <td class="px-2 py-1.5 text-right tabular-nums">
                {formatCount(cohort.users)}
              </td>
              {#each [cohort.day1, cohort.day7, cohort.day30, cohort.day90] as rate, index (index)}
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
{/if}

{#snippet setup()}
  <div
    class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center"
  >
    <p class="font-medium">See who comes back</p>
    <p class="text-fg-tertiary max-w-sm text-sm">
      Retention follows signed-in users across visits and devices. Call identify
      with their account ID on every page load once they are signed in, and with
      null on sign-out.
    </p>
    <div
      class="edge bg-surface-50-bg mt-2 w-full max-w-sm rounded-xl text-left"
    >
      <CodeBlock code={IDENTIFY_CODE} language="javascript" />
    </div>
    <p class="text-fg-muted max-w-sm text-xs">
      Pass an opaque ID, never an email or name. It is hashed in the browser
      before it is sent.
    </p>
  </div>
{/snippet}
