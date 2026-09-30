<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import type { AnonymousStartStep } from '$lib/domains/anonymous/domain/anonymous-preview';
  import type { WatchHistory } from '$lib/domains/anonymous/domain/watch-history';
  import CheckTrace from '$lib/domains/app/projects/ui/service/CheckTrace.svelte';
  import MonitorPanel, {
    CHART_HEIGHT,
    CHART_WIDTH,
  } from '$lib/domains/app/projects/ui/service/MonitorPanel.svelte';
  import { UptimeChart } from '@logdash/hyper-ui/features';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { slide } from 'svelte/transition';
  import { match } from 'ts-pattern';
  import { heroClaim } from './hero-claim.svelte';
  import { heroReading } from './hero-dashboard';
  import { showcaseSwap } from './hero-showcase';
  import { heroTakeover } from './hero-takeover.svelte';

  const CLOCK_TICK_MS = 1_000;
  const HISTORY_HOURS = 90;
  const HISTORY_REVEAL_MS = 240;

  const CREATING_STEPS: { key: AnonymousStartStep; label: string }[] = [
    { key: 'account', label: 'Creating your account' },
    { key: 'project', label: 'Setting up your service' },
    { key: 'check', label: 'Running the first check' },
  ];

  let isOpening = $state(false);
  let now = $state(Date.now());

  const phase = $derived(anonymousPreviewState.phase);
  const previewHost = $derived(anonymousPreviewState.previewHost ?? 'your app');
  const preview = $derived(
    heroReading(
      anonymousPreviewState.pings,
      now,
      'Waiting for the first check',
    ),
  );
  const demo = $derived(
    heroReading(anonymousPreviewState.demo.pings, now, 'Loading checks'),
  );
  const demoHost = $derived(anonymousPreviewState.demo.monitor?.name ?? '');
  const history = $derived(anonymousPreviewState.watchHistory);
  const historyRevealMs = $derived(
    prefersReducedMotion.current ? 0 : HISTORY_REVEAL_MS,
  );
  const claimable = $derived(heroClaim.eligible);
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

  function watchedLabel(watched: WatchHistory): string {
    const since = watched.since.toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
    });
    const outages = match(watched.outages)
      .with(0, () => 'no outages')
      .with(1, () => '1 outage')
      .otherwise((count) => `${count} outages`);

    return `Watched since ${since} · ${outages}`;
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

{#key phase}
  <div in:showcaseSwap>
    {#if phase === 'idle'}
      <MonitorPanel eyebrow="Live monitor" title={demoHost} {...demo} />
    {:else if phase === 'creating'}
      <MonitorPanel
        eyebrow="Setting up"
        title={previewHost}
        status="unknown"
        chart={creatingChart}
      />
    {:else if phase === 'previewing'}
      <MonitorPanel
        eyebrow="Your live monitor"
        title={previewHost}
        {...preview}
      >
        <div class="flex flex-col">
          {#if history}
            <div in:slide={{ duration: historyRevealMs, easing: cubicOut }}>
              {@render watchedHistory(history)}
            </div>
          {/if}

          {@render previewActions()}
        </div>
      </MonitorPanel>
    {:else if phase === 'ended'}
      <MonitorPanel
        eyebrow="Preview expired"
        title={previewHost}
        status="unknown"
      >
        <p class="text-neutral-400 text-sm leading-relaxed">
          This preview is no longer available. Start a new one to keep an eye on
          {previewHost}.
        </p>

        {@render retryButton('Start over', 'hero-preview-restart-cta')}
      </MonitorPanel>
    {:else if phase === 'error'}
      <MonitorPanel
        eyebrow="Could not start"
        title="Something got in the way"
        status="unknown"
      >
        <p class="text-error text-sm leading-relaxed" role="alert">
          {anonymousPreviewState.error?.message}
        </p>

        {@render retryButton('Try again', 'hero-preview-retry-cta')}
      </MonitorPanel>
    {/if}
  </div>
{/key}

{#snippet creatingChart()}
  <div class="flex flex-col gap-4">
    <ol class="flex flex-col gap-3">
      {#each CREATING_STEPS as step, index (step.key)}
        <li class="flex items-center gap-3">
          {#if index < activeStepIndex}
            <span
              class="bg-surface-100 text-success flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
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

    <CheckTrace width={CHART_WIDTH} height={CHART_HEIGHT} />
  </div>
{/snippet}

{#snippet watchedHistory(watched: WatchHistory)}
  <div class="flex flex-col gap-2 pb-4">
    <p class="text-neutral-400 text-xs">{watchedLabel(watched)}</p>

    <UptimeChart
      class="*:last:text-neutral-500"
      buckets={watched.hours}
      maxBucketsToShow={HISTORY_HOURS}
      timeLabel="hours ago"
    />
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

{#snippet retryButton(label: string, posthogId: string)}
  <div>
    <Button
      variant="primary"
      size="sm"
      class="px-5 font-medium"
      data-posthog-id={posthogId}
      onclick={onRetry}
    >
      {label}
    </Button>
  </div>
{/snippet}
