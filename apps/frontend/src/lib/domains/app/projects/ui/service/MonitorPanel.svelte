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

  const times = $derived(responseTimes ?? []);
  const hasFooter = $derived(
    Boolean(notice || checkingLabel || lastCheckLabel),
  );
</script>

<div class="flex w-full flex-col gap-4 p-4">
  <div class="flex flex-col gap-0.5">
    {#if eyebrowHref}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- the monitored URL is external -->
      <a
        href={eyebrowHref}
        target="_blank"
        rel="noopener noreferrer"
        class="text-neutral-500 hover:text-neutral-300 focus-visible:text-neutral-300 focus-visible:outline-brand transition-ink max-w-full self-start truncate rounded-sm text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {eyebrow}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
      <span class="text-neutral-500 truncate text-xs">{eyebrow}</span>
    {/if}

    <div class="flex items-center justify-between gap-3">
      <h3 class="min-h-6 min-w-0 truncate text-base font-medium">
        {#if href}
          <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
          <a
            {href}
            class="hover:text-neutral-300 focus-visible:outline-brand transition-ink rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
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
    <div class="flex flex-wrap gap-x-10 gap-y-3 sm:gap-x-14">
      {#each stats as stat (stat.label)}
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-neutral-500 text-xs">{stat.label}</span>
          <span class="font-figure truncate text-2xl">
            {stat.value}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  {#if chart || responseTimes}
    <div class="flex flex-col gap-2">
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
            <ResponseTimePlot
              responseTimes={times}
              step={CHART_WIDTH / (times.length - 1)}
              height={CHART_HEIGHT}
              maxMs={Math.max(1, ...times)}
            />
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
          class="text-neutral-500 flex items-center justify-between gap-3 font-mono text-xs"
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

  {@render children?.()}
</div>
