<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { Button, Tooltip } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import {
    countryFlag,
    countryName,
    formatCount,
    formatDuration,
  } from '../../domain/analytics-format';
  import { visitKey } from '../../domain/day-analytics';
  import type {
    WebAnalyticsDayHalfHour,
    WebAnalyticsDayVisit,
    WebAnalyticsVisitShow,
  } from '../../domain/web-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import { fitRows, type RowFit } from '../breakdown/fit-rows';
  import MoreRow from '../breakdown/MoreRow.svelte';
  import VisitsTimeline from './VisitsTimeline.svelte';

  type Props = {
    title: string;
    date: string;
    visits: WebAnalyticsDayVisit[];
    total: number;
    halfHours: WebAnalyticsDayHalfHour[];
    loading: boolean;
    error: string | null;
    goals: string[];
    show: WebAnalyticsVisitShow;
    live: boolean;
    now: number;
    onshow: (show: WebAnalyticsVisitShow) => void;
    onmore: () => void;
    onopen: (visit: WebAnalyticsDayVisit) => void;
  };

  const {
    title,
    date,
    visits,
    total,
    halfHours,
    loading,
    error,
    goals,
    show,
    live,
    now,
    onshow,
    onmore,
    onopen,
  }: Props = $props();

  const SHOWS: { value: WebAnalyticsVisitShow; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'stayed', label: 'Stayed' },
    { value: 'goal', label: 'Reached a goal' },
  ];
  const COLUMNS =
    'grid grid-cols-[auto_auto_minmax(0,1fr)_auto_fit-content(10rem)] gap-x-3 @lg:grid-cols-[auto_auto_fit-content(12rem)_minmax(0,1fr)_auto_fit-content(12rem)] @3xl:grid-cols-[auto_auto_fit-content(14rem)_minmax(0,1fr)_auto_auto_fit-content(16rem)] @3xl:gap-x-6';

  let fit = $state<RowFit>({ shown: 0, hidden: 0, more: false });
  let detailsOpen = $state(false);

  function isLive(visit: WebAnalyticsDayVisit): boolean {
    return live && now - Date.parse(visit.lastSeenAt) < 5 * 60_000;
  }

  function onFit(next: RowFit): void {
    fit = next;
  }

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }
</script>

<section
  class="bg-surface-25-bg @container flex h-full min-w-0 flex-col gap-2 rounded-2xl p-2"
  aria-label={title}
>
  <header
    class="flex min-h-7 shrink-0 flex-wrap items-center justify-between gap-2"
  >
    {@render heading()}
    {@render showControl()}
  </header>

  {#if halfHours.length}
    <VisitsTimeline {halfHours} {visits} {live} {now} />
  {/if}

  <div
    class="relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden"
    {@attach fitRows(onFit, total)}
  >
    {@render list()}
    {#if fit.more && visits.length}
      <MoreRow shown={fit.shown} {total} label="visits" onopen={onDetails} />
    {/if}
  </div>
</section>

<DetailsDialog
  isOpen={detailsOpen}
  {title}
  class="max-w-4xl"
  onclose={onDetailsClose}
>
  <div
    class="@container flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pt-3 pb-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-fg-muted px-3 text-[13px] tabular-nums">
        {formatCount(total)} visits
      </p>
      {@render showControl()}
    </div>
    {#if halfHours.length}
      <VisitsTimeline {halfHours} {visits} {live} {now} />
    {/if}
    <div class="flex flex-col gap-0.5">
      {@render list()}
    </div>
    {#if visits.length < total}
      <div class="flex justify-center">
        <Button size="sm" {loading} onclick={onmore}>
          Show {Math.min(25, total - visits.length)} more
        </Button>
      </div>
    {/if}
  </div>
</DetailsDialog>

{#snippet heading()}
  <h2 class="px-3 text-[13px] font-medium">
    {title}
    {#if visits.length || !loading}
      <span class="text-fg-muted font-normal tabular-nums">
        {formatCount(total)}
      </span>
    {/if}
  </h2>
{/snippet}

{#snippet showControl()}
  <SegmentedControl
    size="xs"
    label="Show"
    options={SHOWS}
    value={show}
    onChange={onshow}
  />
{/snippet}

{#snippet list()}
  {#if error}
    <p class="text-error px-3 py-6 text-center text-sm" role="alert">
      {error}
    </p>
  {:else if loading && !visits.length}
    <ul class="flex flex-col gap-0.5" aria-hidden="true">
      {#each [46, 30, 54, 38, 24, 42] as width, index (index)}
        <li class="flex h-8 items-center gap-3 px-3">
          {@render bone('36px', index)}
          {@render bone('112px', index)}
          {@render bone(`${width}%`, index)}
        </li>
      {/each}
    </ul>
  {:else if !visits.length}
    <p class="text-fg-muted py-10 text-center text-sm">
      {show === 'all' ? 'No visits yet' : 'No visits match'}
    </p>
  {:else}
    <div class={COLUMNS}>
      <div
        class="text-fg-muted col-span-full grid h-6 grid-cols-subgrid items-center px-3 text-xs"
        aria-hidden="true"
      >
        <span>Time</span>
        <span></span>
        <span>Source</span>
        <span class="hidden @lg:block">First page</span>
        <span class="hidden text-right @3xl:block">Pages</span>
        <span class="text-right">Stay</span>
        <span></span>
      </div>
      {#key date}
        <ul class="col-span-full grid grid-cols-subgrid gap-y-0.5">
          {#each visits as visit (visitKey(visit))}
            {@render row(visit)}
          {/each}
        </ul>
      {/key}
    </div>
  {/if}
{/snippet}

{#snippet row(visit: WebAnalyticsDayVisit)}
  {@const reached = goals.filter((_, index) => visit.goals[index])}
  <li
    class="col-span-full grid grid-cols-subgrid"
    data-row
    in:fly={{ y: -8, duration: 280, easing: cubicOut }}
  >
    <button
      type="button"
      class="group hover:bg-surface-25-hover-bg focus-visible:outline-brand col-span-full grid h-8 w-full cursor-pointer grid-cols-subgrid items-center rounded-lg px-3 text-left text-sm outline-none focus-visible:outline-2"
      onclick={() => onopen(visit)}
    >
      <span class="text-fg-muted tabular-nums">
        {DateTime.fromISO(visit.startedAt).toFormat('HH:mm')}
      </span>
      {#if visit.country}
        <Tooltip
          content={countryName(visit.country)}
          placement="top"
          class="w-fit leading-none"
        >
          <span role="img" aria-label={countryName(visit.country)}>
            {countryFlag(visit.country)}
          </span>
        </Tooltip>
      {:else}
        <span></span>
      {/if}
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
        class={[
          'hidden min-w-0 items-center gap-1.5 @lg:flex',
          visit.stayed ? 'text-fg-secondary' : 'text-fg-tertiary',
        ]}
      >
        <span class="truncate">{visit.entryPage}</span>
        {#if visit.exitPage && visit.exitPage !== visit.entryPage}
          <span
            class="text-fg-muted hidden shrink-0 truncate text-xs @3xl:inline"
          >
            → {visit.exitPage}
          </span>
        {/if}
      </span>
      <span class="text-fg-tertiary hidden text-right tabular-nums @3xl:block">
        {visit.pageviews}
      </span>
      <span
        class="text-fg-tertiary flex items-center justify-end gap-1.5 tabular-nums"
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
      <span class="flex min-w-0 justify-end gap-1 overflow-hidden">
        {#each reached as goal (goal)}
          <span
            class={[
              'h-5 max-w-full min-w-0 truncate rounded-full px-2 font-mono text-xs leading-5',
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
    </button>
  </li>
{/snippet}

{#snippet bone(width: string, row: number)}
  <span
    class="bg-surface-25-selected-bg h-3 shrink-0 rounded-full motion-safe:animate-ghost"
    style:width
    style:animation-delay="{row * 90}ms"
  ></span>
{/snippet}
