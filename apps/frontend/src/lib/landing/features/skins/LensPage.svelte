<script lang="ts">
  import type { Bucket, Monitor, StatusPage } from '@logdash/status';
  import type { Snippet } from 'svelte';
  import {
    dayStatus,
    dayUptime,
    DEFAULT_DAY_LABELS,
    DEFAULT_LABELS,
    describeHistory,
    formatUptime,
    getLensHover,
    UPTIME_WINDOWS,
    type LensLabels,
  } from './skin-data';

  type Props = {
    page: StatusPage;
    labels?: LensLabels;
    chart?: Snippet<[Monitor]>;
    children?: Snippet;
  };

  const { page, labels = DEFAULT_LABELS, chart, children }: Props = $props();

  const NARROW_DAYS = 30;

  const DATE = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });

  const hover = getLensHover();
  const dayLabels = $derived(labels.day ?? DEFAULT_DAY_LABELS);

  function onPointerOver(event: PointerEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    const day = target?.closest<HTMLElement>('[data-part="day"]');

    if (day) {
      hover.monitor =
        day.closest<HTMLElement>('[data-monitor]')?.dataset.monitor ?? null;
      hover.day = Number(day.dataset.index);
      return;
    }

    if (!target?.closest('[data-part="chart"]')) onPointerLeave();
  }

  function onPointerLeave(event?: PointerEvent): void {
    if (event?.pointerType === 'touch') return;

    hover.monitor = null;
    hover.day = null;
  }

  function isOpen(monitor: Monitor, index: number): boolean {
    return hover.monitor === monitor.id && hover.day === index;
  }

  function position(index: number, total: number): string {
    return `${((index + 0.5) / total) * 100}%`;
  }

  function checksOf(day: Bucket): number {
    return day.successCount + day.failureCount;
  }
</script>

<div
  data-part="page"
  class="relative isolate h-full overflow-hidden px-5 pt-10 sm:px-10 sm:pt-12"
  onpointerover={onPointerOver}
  onpointerleave={onPointerLeave}
>
  <header data-part="header" class="flex flex-col items-center text-center">
    <p data-part="name" class="h-6 text-base leading-6">{page.name}</p>

    <p
      data-part="headline"
      class="mt-3 flex h-18 items-center justify-center gap-3 text-[1.75rem] leading-9 font-medium tracking-[-0.03em] text-balance sm:h-12 sm:text-4xl sm:leading-12 sm:whitespace-nowrap"
    >
      <span
        data-part="mark"
        data-status={page.status}
        class="relative size-2.5 shrink-0 rounded-full"
      ></span>
      {labels.page[page.status]}
    </p>

    <p data-part="updated" class="mt-3 h-5 text-sm leading-5">
      {labels.updated}
    </p>
  </header>

  <ul data-part="monitors" class="mt-10 border-t">
    {#each page.monitors as monitor (monitor.id)}
      <li
        data-part="monitor"
        data-monitor={monitor.id}
        class="relative border-b py-8"
      >
        <div
          data-part="monitor-head"
          class="flex h-7 items-center justify-center gap-2.5 whitespace-nowrap"
        >
          <span data-part="monitor-name" class="text-lg leading-7 font-medium">
            {monitor.name}
          </span>
          <span
            data-part="mark"
            data-status={monitor.status}
            class="relative size-1.5 shrink-0 rounded-full"
          ></span>
          <span data-part="monitor-status" class="text-sm leading-7">
            {labels.monitor[monitor.status]}
          </span>
        </div>

        <dl
          data-part="stats"
          class="mt-6 grid grid-cols-2 gap-y-4 sm:grid-cols-4"
        >
          {#each UPTIME_WINDOWS as window (window)}
            <div data-part="stat" class="flex flex-col items-center gap-1">
              <dt data-part="stat-label" class="h-4 text-xs leading-4">
                {labels.uptime[window]}
              </dt>
              <dd
                data-part="stat-value"
                class="h-7 text-lg leading-7 font-medium tabular-nums"
              >
                {formatUptime(monitor.uptime[window])}
              </dd>
            </div>
          {/each}
        </dl>

        <div
          data-part="chart"
          role="img"
          aria-label={describeHistory(monitor)}
          class="relative mt-6 h-12"
        >
          {#if chart}
            {@render chart(monitor)}
          {:else}
            <div class="days flex h-full gap-px sm:gap-0.5">
              {#each monitor.history.daily as day, index (day.timestamp)}
                <span
                  data-part="day"
                  data-index={index}
                  data-status={dayStatus(day)}
                  data-open={isOpen(monitor, index) ? '' : undefined}
                ></span>
              {/each}
            </div>
          {/if}

          {#if hover.monitor === monitor.id && hover.day !== null && monitor.history.daily[hover.day]}
            {@render tooltip(
              monitor.history.daily[hover.day],
              hover.day,
              monitor.history.daily.length,
            )}
          {/if}
        </div>

        <div
          data-part="axis"
          class="mt-2 flex h-4 justify-between text-xs leading-4"
        >
          <span class="sm:hidden">
            {labels.since(Math.min(30, monitor.history.daily.length))}
          </span>
          <span class="max-sm:hidden">
            {labels.since(monitor.history.daily.length)}
          </span>
          <span>{labels.today}</span>
        </div>
      </li>
    {/each}
  </ul>

  {@render children?.()}
</div>

{#snippet tooltip(day: Bucket, index: number, total: number)}
  {@const narrow = Math.min(NARROW_DAYS, total)}
  {@const uptime = dayUptime(day)}
  <div
    data-part="tooltip"
    data-status={dayStatus(day)}
    aria-hidden="true"
    class="pointer-events-none absolute bottom-full z-10 mb-2 flex w-max max-w-full flex-col gap-1 px-3 py-2.5"
    style:--at-wide={position(index, total)}
    style:--at-narrow={position(index - (total - narrow), narrow)}
  >
    <p data-part="tooltip-date" class="text-sm font-medium">
      {DATE.format(new Date(day.timestamp))}
      <span data-part="tooltip-zone" class="text-xs font-normal">UTC</span>
    </p>
    {#if uptime === null}
      <p data-part="tooltip-checks" class="text-xs">{dayLabels.empty}</p>
    {:else}
      <p
        data-part="tooltip-uptime"
        class="flex items-center gap-2 text-xs tabular-nums"
      >
        <span
          data-part="tooltip-mark"
          data-status={dayStatus(day)}
          class="relative size-1.5 shrink-0 rounded-full"
        ></span>
        {dayLabels.uptime(formatUptime(uptime))}
      </p>
      <p data-part="tooltip-checks" class="text-xs tabular-nums">
        {dayLabels.checks(
          checksOf(day).toLocaleString('en-US'),
          day.averageLatencyMs === null
            ? null
            : String(Math.round(day.averageLatencyMs)),
        )}
      </p>
    {/if}
  </div>
{/snippet}

<style>
  [data-part='page'] {
    background: var(--lens-bg, #101012);
    color: var(--lens-fg, #f4f4f4);
    font-family: var(--lens-font, var(--font-sans));
  }

  [data-part='name'],
  [data-part='updated'],
  [data-part='monitor-status'],
  [data-part='stat-label'],
  [data-part='axis'] {
    color: var(--lens-muted, #8b8b93);
  }

  [data-part='axis'] {
    font-family: var(--lens-mono, var(--font-mono));
  }

  [data-part='monitors'],
  [data-part='monitor'] {
    border-color: var(--lens-line, #222225);
  }

  [data-part='mark'],
  [data-part='tooltip-mark'] {
    background: var(--lens-muted, #8b8b93);
  }

  [data-part='mark'][data-status='operational'],
  [data-part='mark'][data-status='up'],
  [data-part='tooltip-mark'][data-status='up'] {
    background: var(--lens-ok, #16a34a);
  }

  [data-part='mark'][data-status='degraded'],
  [data-part='tooltip-mark'][data-status='degraded'] {
    background: var(--lens-degraded, #f59e0b);
  }

  [data-part='mark'][data-status='outage'],
  [data-part='mark'][data-status='down'],
  [data-part='tooltip-mark'][data-status='down'] {
    background: var(--lens-down, #dc2626);
  }

  [data-part='tooltip'] {
    left: var(--at-wide);
    translate: calc(-1 * var(--at-wide)) 0;
    border: 1px solid var(--lens-line, #222225);
    border-radius: 6px;
    background: var(--lens-popover, #161618);
    color: var(--lens-fg, #f4f4f4);
    box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.5);
  }

  [data-part='tooltip-zone'],
  [data-part='tooltip-checks'] {
    color: var(--lens-muted, #8b8b93);
  }

  [data-part='tooltip-zone'] {
    font-family: var(--lens-mono, var(--font-mono));
  }

  .days > span {
    flex: 1 1 0;
    min-width: 0;
    border-radius: 1px;
    background: var(--lens-up, #4a4a50);
  }

  .days > [data-status='degraded'] {
    background: var(--lens-degraded, #f59e0b);
  }

  .days > [data-status='down'] {
    background: var(--lens-down, #dc2626);
  }

  .days > [data-status='none'] {
    background: var(--lens-none, #232326);
  }

  .days > [data-open] {
    margin-block: -4px;
  }

  .days > [data-status='up'][data-open] {
    background: var(--lens-up-open, #8b8b93);
  }

  .days > [data-status='none'][data-open] {
    background: var(--lens-none-open, #4a4a50);
  }

  @media (width < 40rem) {
    .days > span:nth-last-child(n + 31) {
      display: none;
    }

    [data-part='tooltip'] {
      left: var(--at-narrow);
      translate: calc(-1 * var(--at-narrow)) 0;
    }
  }
</style>
