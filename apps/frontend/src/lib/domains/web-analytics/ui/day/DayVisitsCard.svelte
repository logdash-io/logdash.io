<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { formatCount, formatDuration } from '../../domain/analytics-format';
  import { visitKey } from '../../domain/day-analytics';
  import type {
    WebAnalyticsDayVisit,
    WebAnalyticsVisitShow,
  } from '../../domain/web-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';

  type Props = {
    title: string;
    date: string;
    visits: WebAnalyticsDayVisit[];
    total: number;
    loading: boolean;
    error: string | null;
    goals: string[];
    show: WebAnalyticsVisitShow;
    live: boolean;
    now: number;
    onshow: (show: WebAnalyticsVisitShow) => void;
    onmore: () => void;
    onopen: (visit: WebAnalyticsDayVisit) => void;
    onhover: (source: string | null) => void;
  };

  const {
    title,
    date,
    visits,
    total,
    loading,
    error,
    goals,
    show,
    live,
    now,
    onshow,
    onmore,
    onopen,
    onhover,
  }: Props = $props();

  const SHOWS: { value: WebAnalyticsVisitShow; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'stayed', label: 'Stayed' },
    { value: 'goal', label: 'Reached a goal' },
  ];

  function isLive(visit: WebAnalyticsDayVisit): boolean {
    return live && now - Date.parse(visit.lastSeenAt) < 5 * 60_000;
  }
</script>

<section
  class="bg-surface-25-bg @container flex min-w-0 flex-col gap-2 rounded-2xl p-2"
  aria-label={title}
>
  <header class="flex min-h-7 flex-wrap items-center justify-between gap-2">
    <h2 class="px-3 text-[13px] font-medium">
      {title}
      <span class="text-fg-muted font-normal tabular-nums">
        {formatCount(total)}
      </span>
    </h2>
    <SegmentedControl
      size="xs"
      label="Show"
      options={SHOWS}
      value={show}
      onChange={onshow}
    />
  </header>

  {#if error}
    <p class="text-error px-3 py-6 text-center text-sm" role="alert">
      {error}
    </p>
  {:else if loading && !visits.length}
    <div class="flex flex-col gap-0.5" aria-hidden="true">
      {#each [1, 2, 3, 4, 5, 6] as row (row)}
        <div class="bg-surface-150-bg h-9 rounded-lg"></div>
      {/each}
    </div>
  {:else if !visits.length}
    <p class="text-fg-muted py-10 text-center text-sm">
      {show === 'all' ? 'No visits yet' : 'No visits match'}
    </p>
  {:else}
    {#key date}
      <ul class="flex flex-col gap-0.5">
        {#each visits as visit (visitKey(visit))}
          {@const reached = goals.filter((_, index) => visit.goals[index])}
          <li in:fly={{ y: -8, duration: 280, easing: cubicOut }}>
            <button
              type="button"
              class="group hover:bg-surface-25-hover-bg focus-visible:outline-brand grid w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none focus-visible:outline-2 @3xl:min-h-9 @3xl:grid-cols-[44px_minmax(110px,170px)_minmax(0,1fr)_76px_76px_minmax(96px,auto)] @3xl:gap-x-3 @3xl:px-3 @3xl:py-0"
              onclick={() => onopen(visit)}
              onpointerenter={() => onhover(visit.source)}
              onpointerleave={() => onhover(null)}
              onfocus={() => onhover(visit.source)}
              onblur={() => onhover(null)}
            >
              <span
                class="text-fg-muted row-span-2 self-start tabular-nums @3xl:row-span-1 @3xl:self-center"
              >
                {DateTime.fromISO(visit.startedAt).toFormat('HH:mm')}
              </span>
              <span
                class={[
                  'transition-ink flex min-w-0 items-center gap-2',
                  visit.stayed
                    ? 'text-fg-secondary group-hover:text-fg-default'
                    : 'text-fg-tertiary',
                ]}
              >
                <BreakdownLabel dimension="referrers" name={visit.source} />
              </span>
              <span
                class="col-start-3 row-start-1 flex justify-end gap-1 @3xl:col-start-6"
              >
                {#each reached as goal (goal)}
                  <span
                    class={[
                      'flex h-5 items-center rounded-full px-2 font-mono text-xs whitespace-nowrap',
                      goal === goals[0]
                        ? 'bg-surface-inverse-bg text-fg-inverse font-medium'
                        : 'bg-surface-150-bg text-fg-secondary',
                    ]}
                  >
                    {goal}
                  </span>
                {:else}
                  {#if !visit.stayed}
                    <span class="text-fg-faint text-xs">Left</span>
                  {/if}
                {/each}
              </span>
              <span
                class={[
                  'col-start-2 flex min-w-0 items-center gap-1.5 text-[13px] @3xl:col-start-3 @3xl:row-start-1 @3xl:text-sm',
                  visit.stayed ? 'text-fg-secondary' : 'text-fg-tertiary',
                ]}
              >
                <span class="truncate">{visit.entryPage}</span>
                {#if visit.exitPage && visit.exitPage !== visit.entryPage}
                  <span class="text-fg-muted shrink-0 truncate text-xs">
                    → {visit.exitPage}
                  </span>
                {/if}
              </span>
              <span
                class="text-fg-tertiary hidden text-right tabular-nums @3xl:col-start-4 @3xl:row-start-1 @3xl:block"
              >
                {visit.pageviews}
                {visit.pageviews === 1 ? 'page' : 'pages'}
              </span>
              <span
                class="text-fg-tertiary col-start-3 flex items-center justify-end gap-1.5 text-[13px] tabular-nums @3xl:col-start-5 @3xl:row-start-1 @3xl:text-sm"
              >
                {#if isLive(visit)}
                  <span class="relative flex size-1.5">
                    <span
                      class="bg-success absolute inline-flex size-full rounded-full motion-safe:animate-ping"
                    ></span>
                    <span
                      class="bg-success relative inline-flex size-1.5 rounded-full"
                    ></span>
                  </span>
                {/if}
                {formatDuration(visit.seconds)}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/key}
    {#if visits.length < total}
      <div class="flex justify-center pt-1 pb-0.5">
        <Button size="sm" {loading} onclick={onmore}>
          Show {Math.min(25, total - visits.length)} more
        </Button>
      </div>
    {/if}
  {/if}
</section>
