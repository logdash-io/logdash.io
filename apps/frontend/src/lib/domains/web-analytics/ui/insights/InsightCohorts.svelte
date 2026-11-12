<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { formatCount } from '../../domain/analytics-format';
  import {
    formatInterval,
    formatRate,
    MIN_BASELINE,
    verdictLabel,
  } from '../../domain/day-analytics';
  import type {
    WebAnalyticsInsightBucket,
    WebAnalyticsInsightCohort,
    WebAnalyticsInsightEvent,
  } from '../../domain/web-analytics';
  import {
    cohortTable,
    commonPrefix,
    type CohortCell,
  } from '../../domain/web-analytics-insight';
  import InsightEventName from './InsightEventName.svelte';

  type Props = {
    cohorts: WebAnalyticsInsightCohort[];
    events: WebAnalyticsInsightEvent[];
    bucket: WebAnalyticsInsightBucket;
    property: string;
    lagDays: number[];
  };

  const { cohorts, events, bucket, property, lagDays }: Props = $props();

  const BAR_WIDTH = 88;

  const table = $derived(cohortTable(cohorts, bucket));
  const prefix = $derived(commonPrefix(events.map((event) => event.name)));
  const unit = $derived(
    bucket === 'day' ? 'Day' : bucket === 'week' ? 'Week' : 'Month',
  );
  const units = $derived(`${unit.toLowerCase()}s`);

  function x(rate: number, scale: number): number {
    return 4 + (Math.min(rate, scale) / scale) * (BAR_WIDTH - 8);
  }

  function verdict(cell: CohortCell): string {
    if (cell.filling) return 'Still filling';
    if (cell.typical === null) return 'Not judged';
    if (cell.baseline < MIN_BASELINE) return 'Too few to judge';
    return verdictLabel(cell.flag);
  }
</script>

{#if !cohorts.length}
  <p
    class="text-fg-muted flex flex-1 items-center justify-center py-16 text-sm"
  >
    No events with a {property} date in this period
  </p>
{:else}
  <div class="min-h-0 flex-1 overflow-auto">
    <table
      class="w-full border-separate border-spacing-x-1 border-spacing-y-0 text-sm tabular-nums"
    >
      <thead class="text-fg-muted bg-surface-25-bg sticky top-0 z-10 text-xs">
        <tr>
          <th scope="col" class="px-2 pb-1 text-left align-bottom font-normal">
            {unit}
          </th>
          {#each events as event, index (index)}
            <th
              scope="col"
              class={[
                'pb-1 align-bottom font-normal',
                index ? 'min-w-40 text-center' : 'min-w-16 px-2 text-right',
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
      {#each table.groups as group (group.label)}
        <tbody>
          <tr>
            <th
              scope="rowgroup"
              colspan={events.length + 1}
              class="text-fg-muted px-2 pt-2.5 pb-0.5 text-left text-xs font-normal"
            >
              {group.label}
            </th>
          </tr>
          {#each group.rows as row (row.cohort)}
            <tr>
              <th
                scope="row"
                class="px-2 py-0.5 text-left font-normal whitespace-nowrap"
                title={row.title}
              >
                {row.label}
              </th>
              <td
                class={[
                  'px-2 py-0.5 text-right',
                  row.filling ? 'text-fg-muted' : 'text-fg-tertiary',
                ]}
              >
                {formatCount(row.total)}
              </td>
              {#each row.cells as cell, index (index)}
                {@const scale = table.scales[index]}
                {#snippet card()}
                  <div
                    class="bg-surface-elevated-bg border-surface-elevated-border w-64 rounded-xl border px-3 py-2.5 text-sm shadow-lg"
                  >
                    <p class="text-fg-muted text-xs">
                      {row.title}, {events[index + 1].name.slice(prefix.length)}
                    </p>
                    <p class="mt-1.5 flex items-center justify-between gap-4">
                      <span>{verdict(cell)}</span>
                      <span class="font-medium tabular-nums">
                        {formatRate(cell.rate)}
                      </span>
                    </p>
                    {#if !cell.filling}
                      <p
                        class="text-fg-tertiary mt-1 flex justify-between gap-4"
                      >
                        <span>95% interval</span>
                        <span class="tabular-nums">
                          {formatInterval(cell.interval)}
                        </span>
                      </p>
                      {#if cell.typical !== null}
                        <p
                          class="text-fg-tertiary mt-1 flex justify-between gap-4"
                        >
                          <span>Typical, 4 {units} before</span>
                          <span class="tabular-nums">
                            {formatRate(cell.typical)}
                          </span>
                        </p>
                      {/if}
                    {/if}
                    <p
                      class="text-fg-muted mt-2 text-xs leading-5 whitespace-normal"
                    >
                      {formatCount(cell.hits)} of {formatCount(cell.total)} reached
                      this step.
                      {#if cell.filling}
                        The share can still grow: 95% of these events come
                        within {lagDays[index + 1] ?? 0} days of the {property} date.
                      {:else if cell.typical === null}
                        Fewer than 4 finished {units} before it to compare with.
                      {:else}
                        A share reads above or below usual only when the typical
                        share falls outside its interval.
                      {/if}
                    </p>
                  </div>
                {/snippet}
                <td class="py-0.5">
                  <Tooltip
                    content={card}
                    placement="top"
                    class="hover:bg-surface-50-bg items-center justify-center gap-1 rounded-md px-1.5 py-0.5"
                  >
                    <span
                      class={[
                        'w-12 text-right',
                        { 'text-fg-muted': cell.filling },
                      ]}
                    >
                      {formatRate(cell.rate)}
                    </span>
                    <span
                      class={[
                        'w-3 text-xs font-semibold',
                        cell.flag > 0 ? 'text-success-fg' : 'text-error-fg',
                      ]}
                      role={cell.flag ? 'img' : undefined}
                      aria-label={cell.flag
                        ? verdictLabel(cell.flag)
                        : undefined}
                    >
                      {cell.flag > 0 ? '↑' : cell.flag < 0 ? '↓' : ''}
                    </span>
                    <svg
                      width={BAR_WIDTH}
                      height="18"
                      class="shrink-0"
                      aria-hidden="true"
                    >
                      <line
                        x1="4"
                        x2={BAR_WIDTH - 4}
                        y1="9"
                        y2="9"
                        stroke="var(--surface-50-border)"
                      />
                      {#if cell.filling}
                        <circle
                          cx={x(cell.rate ?? 0, scale)}
                          cy="9"
                          r="3"
                          fill="var(--surface-25-bg)"
                          stroke="var(--fg-muted)"
                          stroke-width="1.5"
                        />
                      {:else}
                        {#if cell.interval}
                          <rect
                            x={x(cell.interval[0], scale)}
                            y="5"
                            width={Math.max(
                              2,
                              x(cell.interval[1], scale) -
                                x(cell.interval[0], scale),
                            )}
                            height="8"
                            rx="4"
                            fill="var(--chart-1)"
                            fill-opacity="0.35"
                          />
                        {/if}
                        {#if cell.typical !== null}
                          <line
                            x1={x(cell.typical, scale)}
                            x2={x(cell.typical, scale)}
                            y1="2"
                            y2="16"
                            stroke="var(--fg-tertiary)"
                            stroke-width="1.5"
                          />
                        {/if}
                        <circle
                          cx={x(cell.rate ?? 0, scale)}
                          cy="9"
                          r="3.5"
                          fill="var(--chart-1)"
                          stroke="var(--surface-25-bg)"
                          stroke-width="1.5"
                        />
                      {/if}
                    </svg>
                    <span class="sr-only">
                      {verdict(cell)}, 95% interval {formatInterval(
                        cell.interval,
                      )}
                    </span>
                  </Tooltip>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      {/each}
    </table>
  </div>
  <p class="text-fg-muted flex flex-wrap gap-x-5 gap-y-1 px-3 pt-2 text-xs">
    <span class="inline-flex items-center gap-1.5">
      <span class="bg-chart-1/35 h-2 w-3.5 rounded-full"></span>
      95% interval
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span
        class="h-3 w-0.5 rounded-full"
        style:background-color="var(--fg-tertiary)"
      ></span>
      Typical, 4 {units} before
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="font-semibold">
        <span class="text-success-fg">↑</span>
        <span class="text-error-fg">↓</span>
      </span>
      Beyond noise
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span
        class="size-2 rounded-full border-[1.5px]"
        style:border-color="var(--fg-muted)"
      ></span>
      Still filling: too young for 95% of these events
    </span>
  </p>
{/if}
