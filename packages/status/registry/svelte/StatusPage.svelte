<script lang="ts" module>
  import {
    StatusPageError,
    type Bucket,
    type Monitor,
    type StatusPage,
    type StatusPageOptions,
  } from '@logdash/status';
  import { statusPage } from '@logdash/status/svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { ClassValue } from 'svelte/elements';

  export { statusPageView, statusBanner, monitorRow, dailyBars };

  export type StatusPageProps = StatusPageOptions & {
    statusPageId: string;
    class?: ClassValue;
  };

  type Status = { label: string; dot: string };
  type DayStatus = 'up' | 'degraded' | 'down' | 'none';
  type GridEvent<T extends Event> = T & { currentTarget: HTMLElement };

  const PAGE_STATUS: Record<StatusPage['status'], Status> = {
    operational: { label: 'All systems operational', dot: 'bg-green-600' },
    degraded: { label: 'Partial outage', dot: 'bg-amber-500' },
    outage: { label: 'Major outage', dot: 'bg-red-600' },
    unknown: { label: 'Status unknown', dot: 'bg-muted-foreground' },
  };

  const MONITOR_STATUS: Record<Monitor['status'], Status> = {
    up: { label: 'Operational', dot: 'bg-green-600' },
    degraded: { label: 'Degraded', dot: 'bg-amber-500' },
    down: { label: 'Down', dot: 'bg-red-600' },
    unknown: { label: 'Unknown', dot: 'bg-muted-foreground' },
  };

  const DAY_BAR: Record<DayStatus, string> = {
    up: 'bg-muted-foreground/40 hover:bg-muted-foreground focus-visible:bg-muted-foreground',
    degraded: 'bg-amber-500',
    down: 'bg-red-600',
    none: 'bg-muted-foreground/15 hover:bg-muted-foreground/40 focus-visible:bg-muted-foreground/40',
  };

  const UPTIME_WINDOWS = [
    ['24h', '24 hours'],
    ['7d', '7 days'],
    ['30d', '30 days'],
    ['90d', '90 days'],
  ] as const;

  const DATE = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });

  function updatedAgo(updatedAt: string): Attachment<HTMLElement> {
    return (node) => {
      const render = () => {
        node.textContent = `Updated ${formatAge(updatedAt, Date.now())}`;
      };
      render();
      const timer = setInterval(render, 1000);
      return () => clearInterval(timer);
    };
  }

  function onBarsKeyDown(event: GridEvent<KeyboardEvent>): void {
    const cells = gridCells(event.currentTarget);
    const from = cells.indexOf(event.target as HTMLElement);
    const to = {
      ArrowLeft: from - 1,
      ArrowRight: from + 1,
      Home: 0,
      End: cells.length - 1,
    }[event.key];

    if (to === undefined || !cells[to]) return;
    event.preventDefault();
    cells[to].focus();
  }

  function onBarsFocus(event: GridEvent<FocusEvent>): void {
    const cells = gridCells(event.currentTarget);
    if (!cells.includes(event.target as HTMLElement)) return;
    for (const cell of cells) {
      cell.tabIndex = cell === event.target ? 0 : -1;
    }
  }

  function gridCells(grid: HTMLElement): HTMLElement[] {
    return Array.from(grid.querySelectorAll<HTMLElement>('[role="gridcell"]'));
  }

  function checksOf(day: Bucket): number {
    return day.successCount + day.failureCount;
  }

  function dayStatus(day: Bucket): DayStatus {
    const checks = checksOf(day);
    if (!checks) return 'none';
    const uptime = day.successCount / checks;
    if (uptime < 0.5) return 'down';
    return uptime < 0.999 ? 'degraded' : 'up';
  }

  function describeDay(day: Bucket): string {
    const date = DATE.format(new Date(day.timestamp));
    const checks = checksOf(day);
    if (!checks) return `${date}: no checks`;

    const uptime = formatUptime((day.successCount / checks) * 100);
    const latency =
      day.averageLatencyMs === null
        ? ''
        : `, ${Math.round(day.averageLatencyMs)} ms average response`;
    return `${date}: ${uptime} uptime, ${checks.toLocaleString('en-US')} checks${latency}`;
  }

  function tooltipLeft(index: number, count: number): string {
    const center = ((index + 0.5) / count) * 100;
    return `clamp(0px, calc(${center}% - 5.5rem), calc(100% - 11rem))`;
  }

  function formatUptime(percent: number | null): string {
    if (percent === null) return 'No data';
    if (percent >= 100) return '100%';
    return `${(Math.floor(percent * 100 + 1e-6) / 100).toFixed(2)}%`;
  }

  function formatAge(from: string, now: number): string {
    const seconds = Math.max(0, Math.round((now - Date.parse(from)) / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.floor(hours / 24)} d ago`;
  }

  function describeError(error: Error): string {
    if (error instanceof StatusPageError && error.status === 404) {
      return 'This status page does not exist. Check the status page ID.';
    }
    if (error instanceof StatusPageError && error.status === 403) {
      return 'This status page is not public.';
    }
    return 'Could not reach the status API. Trying again shortly.';
  }
</script>

<script lang="ts">
  const {
    statusPageId,
    baseUrl,
    pollInterval,
    initialData,
    class: className,
  }: StatusPageProps = $props();

  const status = $derived(
    statusPage(statusPageId, { baseUrl, pollInterval, initialData }),
  );
</script>

<div class={className}>
  {#if status.data}
    {@render statusPageView(status.data)}
  {:else if status.error}
    {@render statusUnavailable(status.error)}
  {:else}
    {@render statusPageSkeleton()}
  {/if}
</div>

{#snippet statusPageView(page: StatusPage)}
  <div class="text-foreground">
    {@render statusBanner(page)}

    {#if page.monitors.length}
      <ul class="border-border mt-8 border-t">
        {#each page.monitors as monitor (monitor.id)}
          <li class="border-border border-b py-6">
            {@render monitorRow(monitor)}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-muted-foreground mt-8 text-sm">
        No monitors on this page yet.
      </p>
    {/if}
  </div>
{/snippet}

{#snippet statusBanner(page: StatusPage)}
  <header class="flex flex-col gap-1">
    <h2 class="text-muted-foreground text-sm">{page.name}</h2>
    <p
      class="flex items-center gap-3 text-2xl font-medium tracking-tight sm:text-3xl"
    >
      <span
        aria-hidden="true"
        class={['size-2.5 shrink-0 rounded-full', PAGE_STATUS[page.status].dot]}
      ></span>
      {PAGE_STATUS[page.status].label}
    </p>
    <time
      datetime={page.updatedAt}
      class="text-muted-foreground min-h-5 text-sm"
      {@attach updatedAgo(page.updatedAt)}
    ></time>
  </header>
{/snippet}

{#snippet monitorRow(monitor: Monitor)}
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h3 class="min-w-0 truncate font-medium">{monitor.name}</h3>
      <span
        class="text-muted-foreground flex shrink-0 items-center gap-2 text-sm"
      >
        <span
          aria-hidden="true"
          class={['size-2 rounded-full', MONITOR_STATUS[monitor.status].dot]}
        ></span>
        {MONITOR_STATUS[monitor.status].label}
      </span>
    </div>

    <dl class="grid grid-cols-4 gap-4 sm:max-w-md">
      {#each UPTIME_WINDOWS as [window, label] (window)}
        <div class="flex flex-col gap-0.5">
          <dt class="text-muted-foreground text-xs">{label}</dt>
          <dd
            class={[
              'text-sm tabular-nums',
              { 'text-muted-foreground': monitor.uptime[window] === null },
            ]}
          >
            {formatUptime(monitor.uptime[window])}
          </dd>
        </div>
      {/each}
    </dl>

    {@render dailyBars(
      monitor.history.daily,
      `${monitor.name}, daily uptime for the last 90 days`,
    )}
  </div>
{/snippet}

{#snippet dailyBars(days: Bucket[], label: string)}
  <div>
    <div
      role="grid"
      tabindex="-1"
      aria-label={label}
      class="relative outline-none"
      onkeydown={onBarsKeyDown}
      onfocusin={onBarsFocus}
    >
      <div role="row" class="flex h-8 gap-px sm:gap-0.5">
        {#each days as day, index (day.timestamp)}
          <div
            role="gridcell"
            tabindex={index === days.length - 1 ? 0 : -1}
            aria-label={describeDay(day)}
            class={[
              'group focus-visible:ring-ring focus-visible:ring-offset-background min-w-0 flex-1 rounded-[1px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              DAY_BAR[dayStatus(day)],
            ]}
          >
            {@render dayTooltip(day, tooltipLeft(index, days.length))}
          </div>
        {/each}
      </div>
    </div>

    <div
      aria-hidden="true"
      class="text-muted-foreground mt-2 flex justify-between font-mono text-xs"
    >
      <span>90 days ago</span>
      <span>Today</span>
    </div>
  </div>
{/snippet}

{#snippet dayTooltip(day: Bucket, left: string)}
  <div
    aria-hidden="true"
    style:left
    class="border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-md border p-3 text-xs shadow-md group-hover:block group-focus-visible:block"
  >
    <p class="font-medium">
      {DATE.format(new Date(day.timestamp))}
      <span class="text-muted-foreground font-normal">UTC</span>
    </p>
    {#if checksOf(day)}
      <dl class="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 tabular-nums">
        <dt class="text-muted-foreground">Uptime</dt>
        <dd class="text-right">
          {formatUptime((day.successCount / checksOf(day)) * 100)}
        </dd>
        <dt class="text-muted-foreground">Checks</dt>
        <dd class="text-right">{checksOf(day).toLocaleString('en-US')}</dd>
        {#if day.averageLatencyMs !== null}
          <dt class="text-muted-foreground">Avg response</dt>
          <dd class="text-right">{Math.round(day.averageLatencyMs)} ms</dd>
        {/if}
      </dl>
    {:else}
      <p class="text-muted-foreground mt-1">No checks this day</p>
    {/if}
  </div>
{/snippet}

{#snippet statusUnavailable(error: Error)}
  <div role="alert" class="flex flex-col gap-1">
    <p
      class="flex items-center gap-3 text-2xl font-medium tracking-tight sm:text-3xl"
    >
      <span
        aria-hidden="true"
        class="bg-muted-foreground size-2.5 shrink-0 rounded-full"
      ></span>
      Status unavailable
    </p>
    <p class="text-muted-foreground text-sm">{describeError(error)}</p>
  </div>
{/snippet}

{#snippet statusPageSkeleton()}
  <div
    aria-busy="true"
    class="flex animate-pulse flex-col motion-reduce:animate-none"
  >
    <span class="sr-only">Loading status</span>
    <div class="bg-muted h-4 w-24 rounded-sm"></div>
    <div class="bg-muted mt-3 h-8 w-72 max-w-full rounded-sm"></div>
    <div class="border-border mt-10 border-t">
      {#each [0, 1] as row (row)}
        <div class="border-border border-b py-6">
          <div class="bg-muted h-4 w-32 rounded-sm"></div>
          <div class="bg-muted mt-6 h-8 rounded-sm"></div>
        </div>
      {/each}
    </div>
  </div>
{/snippet}
