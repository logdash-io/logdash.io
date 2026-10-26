<script lang="ts">
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_ICON_CONTROL,
  } from '$lib/domains/shared/ui/components/toolbar.js';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronLeftIcon from '$lib/domains/shared/icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import RefreshIcon from '$lib/domains/shared/icons/RefreshIcon.svelte';
  import {
    Dropdown,
    Kbd,
    Menu,
    Tooltip,
  } from '@logdash/hyper-ui/presentational';
  import { formatCount } from '../../domain/analytics-format';
  import type { AnalyticsQuery } from '../../domain/analytics-query';
  import { addDays, dayLabel, type StripDay } from '../../domain/day-analytics';
  import type {
    WebAnalyticsGoalOption,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import FilterMenu from './FilterMenu.svelte';

  type Props = {
    online: number | null;
    date: string;
    today: string;
    first: string | null;
    days: StripDay[];
    goals: WebAnalyticsGoalOption[];
    picked: string[];
    query: AnalyticsQuery;
    report: WebAnalyticsReport | null;
    loading: boolean;
    onday: (date: string) => void;
    onpick: (goals: string[]) => void;
    onchange: (query: AnalyticsQuery) => void;
    onfilteropen: () => void;
    onrefresh: () => void;
  };

  const {
    online,
    date,
    today,
    first,
    days,
    goals,
    picked,
    query,
    report,
    loading,
    onday,
    onpick,
    onchange,
    onfilteropen,
    onrefresh,
  }: Props = $props();

  const STEP =
    'hover:text-fg-default transition-ink focus-visible:outline-brand text-fg-tertiary disabled:text-fg-disabled flex h-full w-8 cursor-pointer items-center justify-center focus-visible:-outline-offset-2 focus-visible:outline-2 disabled:cursor-default';
  const ROW =
    'flex h-8 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-sm';

  const menuDays = $derived([
    ...(days.some((day) => day.date === today)
      ? []
      : [{ date: today, visits: null }]),
    ...days
      .filter((day) => day.tracked)
      .map((day) => ({ date: day.date, visits: day.counts.visits }))
      .reverse(),
  ]);
  const second = $derived(picked[1] ?? null);

  function onPrimary(name: string): void {
    const rest = picked[1] === name ? picked[0] : picked[1];
    onpick(rest && rest !== name ? [name, rest] : [name]);
  }

  function onSecond(name: string | null): void {
    if (!picked[0]) return;
    onpick(name ? [picked[0], name] : [picked[0]]);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  {#if online !== null}
    <Tooltip content="Visitors in the last 5 minutes" placement="bottom">
      <span
        class="bg-surface-100-bg text-fg-secondary flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] tabular-nums"
      >
        <span class="relative flex size-1.5">
          {#if online}
            <span
              class="bg-success absolute inline-flex size-full rounded-full motion-safe:animate-ping"
            ></span>
          {/if}
          <span
            class={[
              'relative inline-flex size-1.5 rounded-full',
              online ? 'bg-success' : 'bg-idle',
            ]}
          ></span>
        </span>
        {online} online
      </span>
    </Tooltip>
  {/if}

  <div class="edge flex h-8 shrink-0 items-center rounded-full">
    <Tooltip content={previousTip} placement="bottom">
      <button
        type="button"
        class={[STEP, 'rounded-l-full pl-1']}
        aria-label="Previous day"
        disabled={!first || date <= first}
        onclick={() => onday(addDays(date, -1))}
      >
        <ChevronLeftIcon class="size-3.5" />
      </button>
    </Tooltip>
    <Dropdown>
      {#snippet trigger(attrs)}
        <button
          {...attrs}
          type="button"
          class="hover:text-fg-default transition-ink focus-visible:outline-brand edge-x flex h-full min-w-32 cursor-pointer items-center justify-between gap-2 px-3 text-sm focus-visible:-outline-offset-2 focus-visible:outline-2"
          aria-label="Day: {dayLabel(date, today)}"
        >
          {dayLabel(date, today)}
          <ChevronDownIcon class="text-fg-muted size-3.5" />
        </button>
      {/snippet}
      <Menu
        size="sm"
        class="bg-surface-elevated-bg border-surface-elevated-border mt-2 max-h-80 w-52 flex-nowrap overflow-y-auto rounded-xl border shadow-lg"
      >
        {#each menuDays as entry (entry.date)}
          <li>
            <button
              type="button"
              class={[
                ROW,
                entry.date === date
                  ? 'bg-surface-elevated-selected-bg'
                  : 'hover:bg-surface-elevated-hover-bg',
              ]}
              aria-current={entry.date === date ? 'true' : undefined}
              onclick={() => onday(entry.date)}
            >
              {dayLabel(entry.date, today)}
              {#if entry.visits !== null}
                <span class="text-fg-muted text-xs tabular-nums">
                  {formatCount(entry.visits)}
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </Menu>
    </Dropdown>
    <Tooltip content={nextTip} placement="bottom">
      <button
        type="button"
        class={[STEP, 'rounded-r-full pr-1']}
        aria-label="Next day"
        disabled={date >= today}
        onclick={() => onday(addDays(date, 1))}
      >
        <ChevronRightIcon class="size-3.5" />
      </button>
    </Tooltip>
  </div>

  <Dropdown align="end">
    {#snippet trigger(attrs)}
      <button
        {...attrs}
        type="button"
        class={[TOOLBAR_CONTROL, 'text-fg-tertiary max-w-72']}
        aria-label="Goals: {picked.join(' and ') || 'none'}"
      >
        {#if picked[0]}
          <span class="text-fg-muted">Goal</span>
          <span class="text-fg-default truncate font-mono text-[13px]">
            {picked[0]}
          </span>
          {#if second}
            <span class="text-fg-muted truncate font-mono text-[13px]">
              + {second}
            </span>
          {/if}
        {:else}
          <span>Add a goal</span>
        {/if}
        <ChevronDownIcon class="text-fg-muted size-3.5 shrink-0" />
      </button>
    {/snippet}
    <div
      class="bg-surface-elevated-bg border-surface-elevated-border mt-2 max-h-[min(30rem,70vh)] w-76 overflow-y-auto rounded-xl border p-1.5 shadow-lg"
    >
      {#if goals.length}
        <p
          class="text-fg-muted flex justify-between gap-3 px-2.5 pt-1 pb-1.5 text-xs"
        >
          <span>Primary goal</span>
          <span>Visits, last 28 days</span>
        </p>
        <ul class="flex flex-col">
          {#each goals as goal (goal.name)}
            <li>{@render option(goal, goal.name === picked[0], onPrimary)}</li>
          {/each}
        </ul>
        <p class="text-fg-muted px-2.5 pt-3 pb-1.5 text-xs">Second goal</p>
        <ul class="flex flex-col">
          <li>
            <button
              type="button"
              class={[
                ROW,
                'text-[13px]',
                second === null
                  ? 'bg-surface-elevated-selected-bg'
                  : 'hover:bg-surface-elevated-hover-bg',
              ]}
              aria-current={second === null ? 'true' : undefined}
              onclick={() => onSecond(null)}
            >
              None
            </button>
          </li>
          {#each goals.filter((goal) => goal.name !== picked[0]) as goal (goal.name)}
            <li>{@render option(goal, goal.name === second, onSecond)}</li>
          {/each}
        </ul>
      {:else}
        <div class="flex flex-col gap-2 px-2.5 py-2">
          <p class="text-sm font-medium">No goals yet</p>
          <p class="text-fg-tertiary text-xs leading-5">
            A goal is a custom event, such as a signup. Track one from your
            website:
          </p>
          <code
            class="bg-surface-150-bg rounded-md px-2 py-1 font-mono text-xs whitespace-nowrap"
          >
            window.logdash?.track('signup')
          </code>
        </div>
      {/if}
    </div>
  </Dropdown>

  <FilterMenu {query} {report} {onchange} onopen={onfilteropen} />

  <Tooltip content="Refresh" placement="bottom">
    <button
      type="button"
      class={TOOLBAR_ICON_CONTROL}
      aria-label="Refresh"
      onclick={onrefresh}
    >
      <RefreshIcon class={['size-3.5', { 'animate-spin': loading }]} />
    </button>
  </Tooltip>
</div>

{#snippet option(
  goal: WebAnalyticsGoalOption,
  selected: boolean,
  onselect: (name: string) => void,
)}
  <button
    type="button"
    class={[
      ROW,
      selected
        ? 'bg-surface-elevated-selected-bg'
        : 'hover:bg-surface-elevated-hover-bg',
    ]}
    aria-current={selected ? 'true' : undefined}
    onclick={() => onselect(goal.name)}
  >
    <span class="truncate font-mono text-[13px]">{goal.name}</span>
    <span class="text-fg-muted shrink-0 text-xs tabular-nums">
      {formatCount(goal.visits)}
    </span>
  </button>
{/snippet}

{#snippet previousTip()}
  {@render keyTip('Previous day', '←')}
{/snippet}

{#snippet nextTip()}
  {@render keyTip('Next day', '→')}
{/snippet}

{#snippet keyTip(label: string, key: string)}
  <span
    class="bg-surface-elevated-bg edge text-fg-secondary flex items-center gap-2 rounded-lg px-3 py-1 text-sm whitespace-nowrap shadow"
  >
    {label}
    <Kbd size="sm">{key}</Kbd>
  </span>
{/snippet}
