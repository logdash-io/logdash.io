<script lang="ts" module>
  export const CHART_WIDTH = 240;
  export const CHART_HEIGHT = 56;
</script>

<script lang="ts">
  import type {
    MonitorStat,
    MonitorStatus,
  } from '$lib/domains/app/projects/application/monitor-pings';
  import { StatusBadge } from '@logdash/hyper-ui/features';
  import type { Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import CheckTrace from './CheckTrace.svelte';
  import ResponseTimePlot from './ResponseTimePlot.svelte';

  type Props = {
    eyebrow: string;
    title: string;
    status: MonitorStatus;
    href?: string;
    eyebrowHref?: string;
    notice?: string | null;
    stats?: MonitorStat[];
    responseTimes?: number[];
    checkingLabel?: string;
    lastCheckLabel?: string;
    chart?: Snippet;
    children?: Snippet;
  };

  const {
    eyebrow,
    title,
    status,
    href,
    eyebrowHref,
    notice,
    stats,
    responseTimes,
    checkingLabel,
    lastCheckLabel,
    chart,
    children,
  }: Props = $props();

  const CHART_SWAP_MS = 240;
  const MIN_CHART_SLOTS = 20;
  const CHART_HEADROOM = 1.25;

  const times = $derived(responseTimes ?? []);
  const step = $derived(
    CHART_WIDTH / (Math.max(times.length, MIN_CHART_SLOTS) - 1),
  );
  const hasFooter = $derived(
    Boolean(notice || checkingLabel || lastCheckLabel),
  );
</script>

<section
  class="bg-surface-25-bg flex w-full min-w-0 flex-col gap-2 rounded-2xl p-2 [--chart-surface:var(--surface-25-bg)]"
  aria-label={title}
>
  <div class="flex flex-col gap-0.5 px-3 pt-1.5">
    {#if eyebrowHref}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- the monitored URL is external -->
      <a
        href={eyebrowHref}
        target="_blank"
        rel="noopener noreferrer"
        class="text-fg-muted hover:text-fg-secondary focus-visible:text-fg-secondary focus-visible:outline-brand transition-ink max-w-full self-start truncate rounded-sm text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {eyebrow}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
      <span class="text-fg-muted truncate text-xs">{eyebrow}</span>
    {/if}

    <div class="flex items-center justify-between gap-3">
      <h3 class="min-h-6 min-w-0 truncate text-base font-medium">
        {#if href}
          <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
          <a
            {href}
            class="hover:text-fg-secondary focus-visible:outline-brand transition-ink rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {title}
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {:else}
          {title}
        {/if}
      </h3>

      <div class="shrink-0">
        <StatusBadge {status} showText={true} />
      </div>
    </div>
  </div>

  {#if stats}
    <dl
      class="grid grid-flow-col grid-cols-3 grid-rows-[auto_auto] gap-x-2 gap-y-1.5 py-3"
    >
      {#each stats as stat (stat.label)}
        <div class="contents">
          <dt class="text-fg-muted min-w-0 px-3 text-xs">{stat.label}</dt>
          <dd class="min-w-0 truncate px-3 font-mono text-2xl tabular-nums">
            {stat.value}
          </dd>
        </div>
      {/each}
    </dl>
  {/if}

  {#if chart || responseTimes}
    <div class="flex flex-col gap-2 px-3 pb-1.5">
      <div class="grid">
        {#if chart}
          <div
            class="[grid-area:1/1]"
            out:fade={{ duration: CHART_SWAP_MS, easing: cubicOut }}
          >
            {@render chart()}
          </div>
        {:else if times.length > 1}
          <svg
            class="h-14 w-full [grid-area:1/1]"
            viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
            preserveAspectRatio="none"
            aria-hidden="true"
            in:fade={{ duration: CHART_SWAP_MS, easing: cubicOut }}
          >
            <path
              d="M0 {CHART_HEIGHT - 0.5} H{CHART_WIDTH}"
              stroke="var(--edge-color)"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
            <g
              transform="translate({CHART_WIDTH - (times.length - 1) * step} 0)"
            >
              <ResponseTimePlot
                responseTimes={times}
                {step}
                height={CHART_HEIGHT}
                maxMs={Math.max(1, ...times) * CHART_HEADROOM}
              />
            </g>
          </svg>
        {:else}
          <div
            class="[grid-area:1/1]"
            out:fade={{ duration: CHART_SWAP_MS, easing: cubicOut }}
          >
            <CheckTrace width={CHART_WIDTH} height={CHART_HEIGHT} />
          </div>
        {/if}
      </div>

      {#if hasFooter}
        <div
          class="text-fg-muted flex items-center justify-between gap-3 font-mono text-xs"
        >
          <span
            class={['truncate', { 'text-error': notice }]}
            title={notice ?? undefined}
            role="status"
          >
            {notice ?? checkingLabel}
          </span>
          <span class="shrink-0">{lastCheckLabel}</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if children}
    <div class="px-3 pb-1.5 empty:hidden">
      {@render children()}
    </div>
  {/if}
</section>
