<script lang="ts">
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_ICON_CONTROL,
  } from '$lib/domains/shared/ui/components/toolbar.js';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronLeftIcon from '$lib/domains/shared/icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import RefreshIcon from '$lib/domains/shared/icons/RefreshIcon.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
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
  const MAX_GOALS = 10;

  let adding = $state(false);

  const menuDays = $derived([
    ...(days.some((day) => day.date === today)
      ? []
      : [{ date: today, visits: null }]),
    ...days
      .filter((day) => day.tracked)
      .map((day) => ({ date: day.date, visits: day.counts.visits }))
      .reverse(),
  ]);
  const columns = $derived(
    adding || !picked.length ? [...picked, null] : picked,
  );
  const canAdd = $derived(
    !adding &&
      picked.length > 0 &&
      picked.length < MAX_GOALS &&
      goals.length > picked.length,
  );

  function columnLabel(index: number): string {
    if (index === 0) return 'Primary goal';
    return index === 1 ? 'Secondary goal' : `Goal ${index + 1}`;
  }

  function choices(index: number): WebAnalyticsGoalOption[] {
    return goals.filter(
      (goal) => !picked.some((name, at) => name === goal.name && at !== index),
    );
  }

  function onPick(index: number, name: string): void {
    adding = false;
    if (index === picked.length) {
      onpick([...picked, name]);
      return;
    }
    onpick(picked.map((current, at) => (at === index ? name : current)));
  }

  function onRemove(index: number): void {
    if (index === picked.length) {
      adding = false;
      return;
    }
    onpick(picked.filter((_, at) => at !== index));
  }

  function onAdd(): void {
    adding = true;
  }

  function onPickerClick(event: MouseEvent): void {
    event.stopPropagation();
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

  <Dropdown align="end" class="max-w-[calc(100vw-1rem)]">
    {#snippet trigger(attrs)}
      <button
        {...attrs}
        type="button"
        class={[TOOLBAR_CONTROL, 'text-fg-tertiary max-w-full min-w-0']}
        aria-label="Goals: {picked.join(', ') || 'none'}"
      >
        {#if picked.length}
          <span class="text-fg-muted">
            {picked.length === 1 ? 'Goal' : 'Goals'}
          </span>
          <span class="flex min-w-0 items-center gap-1.5 font-mono text-[13px]">
            {#each picked as name, index (name)}
              {#if index}
                <span class="text-fg-faint" aria-hidden="true">·</span>
              {/if}
              <span
                class={[
                  'truncate',
                  index ? 'text-fg-secondary' : 'text-fg-default',
                ]}
              >
                {name}
              </span>
            {/each}
          </span>
        {:else}
          <span>Add a goal</span>
        {/if}
        <ChevronDownIcon class="text-fg-muted size-3.5 shrink-0" />
      </button>
    {/snippet}
    <div
      class="bg-surface-elevated-bg border-surface-elevated-border mt-2 flex max-w-full flex-col overflow-hidden rounded-xl border shadow-lg"
      role="presentation"
      onclick={onPickerClick}
    >
      {#if goals.length}
        <div class="edge-between-x flex overflow-x-auto">
          {#each columns as name, index (name ?? 'new')}
            <section
              class="flex w-60 shrink-0 flex-col p-1.5"
              aria-label={columnLabel(index)}
            >
              <header
                class="text-fg-muted flex h-7 items-center justify-between gap-2 pr-1 pl-2.5 text-xs"
              >
                <span class={{ 'text-fg-secondary': name === null }}>
                  {columnLabel(index)}
                </span>
                {#if columns.length > 1}
                  <button
                    type="button"
                    class="text-fg-muted hover:text-fg-default hover:bg-surface-elevated-hover-bg transition-ink focus-visible:outline-brand flex size-6 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2"
                    aria-label="Remove {columnLabel(index)}"
                    onclick={() => onRemove(index)}
                  >
                    <CloseIcon class="size-3.5" />
                  </button>
                {/if}
              </header>
              <ul class="flex max-h-[min(24rem,60vh)] flex-col overflow-y-auto">
                {#each choices(index) as goal (goal.name)}
                  <li>
                    {@render option(goal, goal.name === name, (chosen) =>
                      onPick(index, chosen),
                    )}
                  </li>
                {/each}
              </ul>
            </section>
          {/each}
          {#if canAdd}
            <button
              type="button"
              class="text-fg-tertiary hover:text-fg-default hover:bg-surface-elevated-hover-bg transition-ink focus-visible:outline-brand flex w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 text-xs focus-visible:-outline-offset-2 focus-visible:outline-2"
              onclick={onAdd}
            >
              <span
                class="edge flex size-7 items-center justify-center rounded-full"
              >
                <PlusIcon class="size-3.5" />
              </span>
              Add goal
            </button>
          {/if}
        </div>
        <p class="edge-t text-fg-muted px-4 py-2.5 text-xs leading-5">
          Each goal counts the people who did it on a day, on your website or in
          your apps, on its own. Numbers next to a goal add up its last 28 days.
        </p>
      {:else}
        <div class="flex w-76 flex-col gap-2 p-4">
          <p class="text-sm font-medium">No goals yet</p>
          <p class="text-fg-tertiary text-xs leading-5">
            A goal is a custom event, such as a signup. Track one from your
            website or app:
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
