<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import type { AnonymousStartStep } from '$lib/domains/anonymous/domain/anonymous-preview';
  import type { WatchHistory } from '$lib/domains/anonymous/domain/watch-history';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings';
  import { StatusBadge, UptimeChart } from '@logdash/hyper-ui/features';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade, slide } from 'svelte/transition';
  import { match } from 'ts-pattern';
  import ResponseTimePlot from '../ResponseTimePlot.svelte';
  import HeroCheckTrace from './HeroCheckTrace.svelte';
  import { heroClaim } from './hero-claim.svelte';
  import {
    checkIntervalLabel,
    lastCheckLabel,
    noResponseReason,
    responseTimes,
    toChartPings,
    uptimeLabel,
    type ChartPing,
    type MonitorStatus,
  } from './hero-pings';
  import { showcaseSwap } from './hero-showcase';
  import { heroTakeover } from './hero-takeover.svelte';

  type TileStat = {
    label: string;
    value: string;
  };

  const CHART_WIDTH = 240;
  const CHART_HEIGHT = 56;
  const CHART_SWAP_MS = 240;
  const CLOCK_TICK_MS = 1_000;
  const HISTORY_HOURS = 90;
  const HISTORY_REVEAL_MS = 240;

  const CREATING_STEPS: { key: AnonymousStartStep; label: string }[] = [
    { key: 'account', label: 'Creating your account' },
    { key: 'project', label: 'Setting up your project' },
    { key: 'check', label: 'Running the first check' },
  ];

  let isOpening = $state(false);
  let now = $state(Date.now());

  const phase = $derived(anonymousPreviewState.phase);

  const previewPings = $derived(toChartPings(anonymousPreviewState.pings));
  const previewStatus = $derived<MonitorStatus>(
    getStatusFromPings(previewPings),
  );
  const previewHost = $derived(anonymousPreviewState.previewHost ?? 'your app');
  const previewStats = $derived(statsFor(previewPings));
  const previewFailure = $derived(noResponseReason(previewPings.at(-1)));
  const previewHistory = $derived(anonymousPreviewState.watchHistory);
  const historyRevealMs = $derived(
    prefersReducedMotion.current ? 0 : HISTORY_REVEAL_MS,
  );
  const claimable = $derived(heroClaim.eligible);

  const demoPings = $derived(toChartPings(anonymousPreviewState.demo.pings));
  const demoStatus = $derived<MonitorStatus>(getStatusFromPings(demoPings));
  const demoHost = $derived(anonymousPreviewState.demo.monitor?.name ?? '');
  const demoStats = $derived(statsFor(demoPings));

  const activeStepIndex = $derived(
    CREATING_STEPS.findIndex(
      (step) => step.key === anonymousPreviewState.creatingStep,
    ),
  );

  $effect(() => {
    const timer = setInterval(() => {
      now = Date.now();
    }, CLOCK_TICK_MS);

    return () => clearInterval(timer);
  });

  function statsFor(pings: ChartPing[]): TileStat[] {
    const last = pings.at(-1);
    const answered = last?.statusCode ? last : null;

    return [
      {
        label: 'Response',
        value: answered ? `${answered.responseTimeMs} ms` : '--',
      },
      { label: 'Status', value: answered ? `${answered.statusCode}` : '--' },
      { label: 'Uptime', value: uptimeLabel(pings) ?? '--' },
    ];
  }

  function watchedLabel(history: WatchHistory): string {
    const since = history.since.toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
    });
    const outages = match(history.outages)
      .with(0, () => 'no outages')
      .with(1, () => '1 outage')
      .otherwise((count) => `${count} outages`);

    return `Watched since ${since} · ${outages}`;
  }

  function maxResponseMs(times: number[]): number {
    return Math.max(1, ...times);
  }

  function checkingLabel(pings: ChartPing[]): string {
    const interval = checkIntervalLabel(pings);

    return interval ? `Checking every ${interval}` : 'Checking';
  }

  async function onOpenDashboard(): Promise<void> {
    if (isOpening) {
      return;
    }

    isOpening = true;

    try {
      await anonymousPreviewState.openDashboard();
    } finally {
      isOpening = false;
    }
  }

  function onSetUpAlerts(): void {
    if (!heroTakeover.expanded) {
      heroTakeover.expand(null);
    }

    heroClaim.show('alerts');
  }

  function onRetry(): void {
    anonymousPreviewState.retry();
  }
</script>

<div class="w-full px-4 py-4">
  {#key phase}
    <div class="flex flex-col gap-4" in:showcaseSwap>
      {#if phase === 'idle'}
        {@render demoTile()}
      {:else if phase === 'creating'}
        {@render creatingTile()}
      {:else if phase === 'previewing'}
        {@render previewingTile()}
      {:else if phase === 'ended'}
        {@render endedTile()}
      {:else if phase === 'error'}
        {@render errorTile()}
      {/if}
    </div>
  {/key}
</div>

{#snippet creatingTile()}
  {@render tileHeader('Setting up', previewHost, 'unknown')}

  <ol class="flex flex-col gap-3">
    {#each CREATING_STEPS as step, index (step.key)}
      <li class="flex items-center gap-3">
        {#if index < activeStepIndex}
          <span
            class="bg-success/15 text-success flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          >
            &check;
          </span>
        {:else if index === activeStepIndex}
          <span class="flex size-5 shrink-0 items-center justify-center">
            <Spinner size="xs" class="text-brand" aria-hidden="true" />
          </span>
        {:else}
          <span
            class="border-neutral-700 size-5 shrink-0 rounded-full border border-dashed"
          ></span>
        {/if}

        <span
          class={[
            'text-sm transition-ink duration-200',
            index <= activeStepIndex ? 'text-fg-default' : 'text-neutral-500',
          ]}
        >
          {step.label}
        </span>
      </li>
    {/each}
  </ol>

  <HeroCheckTrace width={CHART_WIDTH} height={CHART_HEIGHT} />
{/snippet}

{#snippet demoTile()}
  {@render tileHeader('Live monitor', demoHost, demoStatus)}

  {@render tileStats(demoStats)}

  {@render historyBar(
    demoPings,
    checkingLabel(demoPings),
    lastCheckLabel(demoPings, now) ?? 'Loading checks',
  )}
{/snippet}

{#snippet previewingTile()}
  {@render tileHeader('Your live monitor', previewHost, previewStatus)}

  {#if previewFailure}
    <p class="text-error -mt-2 text-sm text-pretty" role="status">
      {previewFailure}
    </p>
  {/if}

  {@render tileStats(previewStats)}

  {@render historyBar(
    previewPings,
    checkingLabel(previewPings),
    lastCheckLabel(previewPings, now) ?? 'Waiting for the first check',
  )}

  <div class="flex flex-col">
    {#if previewHistory}
      <div in:slide={{ duration: historyRevealMs, easing: cubicOut }}>
        {@render watchedHistory(previewHistory)}
      </div>
    {/if}

    {@render previewActions()}
  </div>
{/snippet}

{#snippet historyBar(pings: ChartPing[], left: string, right: string)}
  <div class="flex flex-col gap-2">
    <div class="grid">
      {#if pings.length > 1}
        {@const times = responseTimes(pings)}

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
            maxMs={maxResponseMs(times)}
          />
        </svg>
      {:else}
        <div
          class="[grid-area:1/1]"
          out:fade={{ duration: CHART_SWAP_MS, easing: cubicOut }}
        >
          <HeroCheckTrace width={CHART_WIDTH} height={CHART_HEIGHT} />
        </div>
      {/if}
    </div>

    {@render tileFooter(left, right)}
  </div>
{/snippet}

{#snippet watchedHistory(history: WatchHistory)}
  <div class="flex flex-col gap-2 pb-4">
    <p class="text-neutral-400 text-xs">{watchedLabel(history)}</p>

    <UptimeChart
      class="*:last:text-neutral-500"
      buckets={history.hours}
      maxBucketsToShow={HISTORY_HOURS}
      timeLabel="hours ago"
    />
  </div>
{/snippet}

{#snippet endedTile()}
  {@render tileHeader('Preview expired', previewHost, 'unknown')}

  <p class="text-neutral-400 text-sm leading-relaxed">
    This preview is no longer available. Start a new one to keep an eye on
    {previewHost}.
  </p>

  <div>
    <Button
      variant="primary"
      size="sm"
      class="px-5 font-medium"
      data-posthog-id="hero-preview-restart-cta"
      onclick={onRetry}
    >
      Start over
    </Button>
  </div>
{/snippet}

{#snippet errorTile()}
  {@render tileHeader('Could not start', 'Something got in the way', 'unknown')}

  <p class="text-error/90 text-sm leading-relaxed" role="alert">
    {anonymousPreviewState.error?.message}
  </p>

  <div>
    <Button
      variant="primary"
      size="sm"
      class="px-5 font-medium"
      data-posthog-id="hero-preview-retry-cta"
      onclick={onRetry}
    >
      Try again
    </Button>
  </div>
{/snippet}

{#snippet previewActions()}
  <div class="flex flex-wrap items-center gap-2">
    {#if claimable}
      <Button
        variant="primary"
        size="sm"
        class="px-5 font-medium"
        data-posthog-id="hero-setup-alerts-cta"
        disabled={isOpening}
        onclick={onSetUpAlerts}
      >
        Set up alerts
      </Button>

      {@render openDashboardButton('subtle')}
    {:else}
      {@render openDashboardButton('primary')}

      <Button
        variant="subtle"
        size="sm"
        class="px-4 font-medium"
        data-posthog-id="hero-setup-alerts-cta"
        disabled={isOpening}
        onclick={onOpenDashboard}
      >
        Set up alerts
      </Button>
    {/if}
  </div>
{/snippet}

{#snippet openDashboardButton(variant: 'primary' | 'subtle')}
  <Button
    {variant}
    size="sm"
    class="px-5 font-medium"
    data-posthog-id="hero-open-dashboard-cta"
    disabled={isOpening}
    onclick={onOpenDashboard}
  >
    {#if isOpening}
      <Spinner class="size-3.5" aria-hidden="true" />
    {/if}
    Open your dashboard
    <ArrowRightIcon class="size-4" />
  </Button>
{/snippet}

{#snippet tileHeader(eyebrow: string, title: string, status: MonitorStatus)}
  <div class="flex flex-col gap-0.5">
    <span class="text-neutral-500 truncate text-xs">{eyebrow}</span>

    <div class="flex items-center justify-between gap-3">
      <h3 class="min-h-6 min-w-0 truncate text-base font-medium">{title}</h3>

      <div class="shrink-0">
        <StatusBadge {status} showText={true} />
      </div>
    </div>
  </div>
{/snippet}

{#snippet tileStats(stats: TileStat[])}
  <div class="flex flex-wrap gap-x-10 gap-y-3 sm:gap-x-14">
    {#each stats as stat (stat.label)}
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="text-neutral-500 text-xs">{stat.label}</span>
        <span class="truncate text-2xl font-medium tabular-nums">
          {stat.value}
        </span>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet tileFooter(left: string, right: string)}
  <div
    class="text-neutral-500 flex items-center justify-between gap-3 font-mono text-xs"
  >
    <span class="truncate">{left}</span>
    <span class="shrink-0">{right}</span>
  </div>
{/snippet}
