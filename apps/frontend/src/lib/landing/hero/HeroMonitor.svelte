<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import type { AnonymousStartStep } from '$lib/domains/anonymous/domain/anonymous-preview';
  import CheckTrace from '$lib/domains/app/projects/ui/service/CheckTrace.svelte';
  import MonitorPanel, {
    CHART_HEIGHT,
    CHART_WIDTH,
  } from '$lib/domains/app/projects/ui/service/MonitorPanel.svelte';
  import { monitorEyebrow } from '$lib/domains/app/projects/ui/service/monitor-panel-content';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { heroClaim } from './hero-claim.svelte';
  import { demoName, heroReading } from './hero-dashboard';
  import { showcaseSwap } from './hero-showcase';
  import { heroTakeover } from './hero-takeover.svelte';

  const CLOCK_TICK_MS = 1_000;

  const CREATING_STEPS: { key: AnonymousStartStep; label: string }[] = [
    { key: 'account', label: 'Creating your account' },
    { key: 'check', label: 'Running the first check' },
  ];

  let isOpening = $state(false);
  let now = $state(Date.now());

  const phase = $derived(anonymousPreviewState.phase);
  const previewHost = $derived(anonymousPreviewState.previewHost ?? 'your app');
  const preview = $derived(
    heroReading(
      anonymousPreviewState.pings,
      anonymousPreviewState.previewHours,
      now,
      'Waiting for the first check',
    ),
  );
  const demo = $derived(
    heroReading(
      anonymousPreviewState.demo.pings,
      anonymousPreviewState.demo.hours,
      now,
      anonymousPreviewState.demo.loaded && !anonymousPreviewState.demo.monitor
        ? 'Waiting for your URL'
        : 'Loading checks',
    ),
  );
  const demoMonitor = $derived(anonymousPreviewState.demo.monitor);
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

    heroClaim.show();
  }

  function onRetry(): void {
    anonymousPreviewState.retry();
  }
</script>

{#key phase}
  <div in:showcaseSwap>
    {#if phase === 'idle'}
      <MonitorPanel
        eyebrow={demoMonitor ? monitorEyebrow(demoMonitor) : 'Live monitor'}
        title={demoName(anonymousPreviewState.demo)}
        {...demo}
      />
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
        {@render previewActions()}
      </MonitorPanel>
    {:else if phase === 'ended'}
      <MonitorPanel
        eyebrow="Preview expired"
        title={previewHost}
        status="unknown"
      >
        <p class="text-fg-tertiary text-sm leading-relaxed">
          This preview is no longer available. Start a new one to keep an eye on
          {previewHost}.
        </p>

        {@render retryButton('Start over')}
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

        {@render retryButton('Try again')}
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
              class="bg-surface-150-bg text-success flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            >
              &check;
            </span>
          {:else if index === activeStepIndex}
            <span class="flex size-5 shrink-0 items-center justify-center">
              <Spinner size="xs" class="text-brand" aria-hidden="true" />
            </span>
          {:else}
            <span
              class="border-surface-150-border size-5 shrink-0 rounded-full border border-dashed"
            ></span>
          {/if}

          <span
            class={[
              'text-sm transition-ink duration-200',
              index <= activeStepIndex ? 'text-fg-default' : 'text-fg-muted',
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

{#snippet previewActions()}
  <div class="flex flex-wrap items-center gap-2">
    {#if claimable}
      <Button
        variant="primary"
        size="sm"
        disabled={isOpening}
        onclick={onSetUpAlerts}
      >
        Set up alerts
      </Button>

      {@render openDashboardButton('secondary')}
    {:else}
      {@render openDashboardButton('primary')}

      <Button size="sm" disabled={isOpening} onclick={onOpenDashboard}>
        Set up alerts
      </Button>
    {/if}
  </div>
{/snippet}

{#snippet openDashboardButton(variant: 'primary' | 'secondary')}
  <Button {variant} size="sm" disabled={isOpening} onclick={onOpenDashboard}>
    {#if isOpening}
      <Spinner class="size-3.5" aria-hidden="true" />
    {/if}
    Open your dashboard
    <ArrowRightIcon class="size-4" />
  </Button>
{/snippet}

{#snippet retryButton(label: string)}
  <div>
    <Button variant="primary" size="sm" onclick={onRetry}>
      {label}
    </Button>
  </div>
{/snippet}
