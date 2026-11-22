<script lang="ts">
  import { DateTime } from 'luxon';
  import { formatCount } from '../../domain/analytics-format';
  import type {
    WebAnalyticsDayHalfHour,
    WebAnalyticsDayVisit,
  } from '../../domain/web-analytics';
  import {
    halfHourTimeline,
    type HalfHourBin,
  } from '../../domain/day-analytics';

  type Props = {
    halfHours: WebAnalyticsDayHalfHour[];
    visits: WebAnalyticsDayVisit[];
    live: boolean;
    now: number;
  };

  const { halfHours, visits, live, now }: Props = $props();

  const AXIS = ['00', '06', '12', '18', '24'];

  let hovered = $state<number | null>(null);

  const fresh = $derived(
    live
      ? visits.filter(
          (visit) => now - Date.parse(visit.lastSeenAt) < 5 * 60_000,
        )
      : [],
  );
  const timeline = $derived(
    halfHourTimeline(
      halfHours,
      fresh.map((visit) => ({
        half: halfOf(visit.startedAt),
        stayed: visit.stayed,
        goal: visit.goals.some(Boolean),
      })),
    ),
  );
  const visitCount = $derived(
    halfHours.reduce(
      (sum, half) => sum + half.goal + half.stayed + half.left,
      0,
    ),
  );
  const minute = $derived(
    live
      ? DateTime.fromMillis(now).hour * 60 + DateTime.fromMillis(now).minute
      : null,
  );
  const readout = $derived(
    hovered === null ? null : describe(hovered, timeline.bins[hovered]),
  );

  function halfOf(iso: string): number {
    const time = DateTime.fromISO(iso);
    return time.hour * 2 + Number(time.minute >= 30);
  }

  function describe(index: number, bin: HalfHourBin): string {
    const start = DateTime.fromObject({ hour: 0 }).plus({
      minutes: index * 30,
    });
    const range = `${start.toFormat('HH:mm')}–${start.plus({ minutes: 30 }).toFormat('HH:mm')}`;
    const parts = [
      `${formatCount(bin.goal + bin.stayed + bin.left + bin.live)} visits`,
      bin.goal && `${formatCount(bin.goal)} reached a goal`,
      bin.stayed && `${formatCount(bin.stayed)} stayed`,
      bin.left && `${formatCount(bin.left)} left`,
      bin.live && `${formatCount(bin.live)} online`,
    ].filter(Boolean);
    return `${range} · ${parts.join(' · ')}`;
  }

  function onLeave(): void {
    hovered = null;
  }
</script>

<figure
  class="flex shrink-0 flex-col gap-1 px-1"
  aria-label="{formatCount(visitCount)} visits by the half hour they started in"
>
  <div class="relative h-[76px]" role="presentation" onpointerleave={onLeave}>
    <div
      class="absolute inset-x-0 top-0 bottom-4 grid grid-cols-[repeat(48,minmax(0,1fr))]"
      aria-hidden="true"
    >
      {#each timeline.dots as dots, index (index)}
        <div
          class="hover:bg-surface-25-hover-bg flex flex-col-reverse items-center gap-0.5 rounded-sm pb-1"
          role="presentation"
          onpointerenter={() => (hovered = index)}
        >
          {#each dots as kind, dot (dot)}
            <span
              class={[
                'shrink-0 rounded-full',
                kind === 'goal'
                  ? 'bg-surface-inverse-bg size-[7px]'
                  : 'size-[5px]',
                {
                  'text-fg-tertiary bg-current': kind === 'stayed',
                  'text-fg-disabled bg-current': kind === 'left',
                  'bg-success': kind === 'live',
                },
              ]}
            ></span>
          {/each}
        </div>
      {/each}
    </div>
    <span
      class="bg-surface-25-border absolute inset-x-0 bottom-4 h-px"
      aria-hidden="true"
    ></span>
    {#if minute !== null}
      <span
        class="text-fg-faint absolute top-0 bottom-4 w-px bg-current"
        style:left="{(minute / 1440) * 100}%"
        aria-hidden="true"
      ></span>
    {/if}
    <div
      class="text-fg-muted absolute inset-x-0 bottom-0 flex h-3.5 justify-between text-[11px] leading-3.5 tabular-nums"
      aria-hidden="true"
    >
      {#each AXIS as hour (hour)}
        <span>{hour}</span>
      {/each}
    </div>
  </div>
  <figcaption
    class="text-fg-muted flex h-4 items-center gap-3 truncate text-[11px] tabular-nums"
  >
    {#if readout}
      <span class="text-fg-secondary truncate">{readout}</span>
    {:else}
      {@render key('bg-surface-inverse-bg size-[7px]', 'Reached a goal')}
      {@render key('text-fg-tertiary bg-current size-[5px]', 'Stayed')}
      {@render key('text-fg-disabled bg-current size-[5px]', 'Left')}
      {#if fresh.length}
        {@render key('bg-success size-[5px]', 'Online')}
      {/if}
      {#if timeline.per > 1}
        <span class="ml-auto shrink-0">1 dot = {timeline.per} visits</span>
      {/if}
    {/if}
  </figcaption>
</figure>

{#snippet key(dot: string, label: string)}
  <span class="flex shrink-0 items-center gap-1.5">
    <span class={['rounded-full', dot]}></span>
    {label}
  </span>
{/snippet}
