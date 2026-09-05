<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import {
    previewNameFromUrl,
    type AnonymousStartStep,
  } from '$lib/domains/anonymous/domain/anonymous-preview';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings';
  import { StatusBadge, StatusHistoryBar } from '@logdash/hyper-ui/features';
  import { ArrowRightIcon } from 'lucide-svelte';
  import {
    toChartPings,
    type ChartPing,
    type MonitorStatus,
  } from './hero-pings';

  type TileStat = {
    label: string;
    value: string;
  };

  const CREATING_STEPS: { key: AnonymousStartStep; label: string }[] = [
    { key: 'account', label: 'Creating your account' },
    { key: 'project', label: 'Setting up your project' },
    { key: 'check', label: 'Running the first check' },
  ];

  let isOpening = $state(false);

  const phase = $derived(anonymousPreviewState.phase);

  const previewPings = $derived(toChartPings(anonymousPreviewState.pings));
  const previewStatus = $derived<MonitorStatus>(
    getStatusFromPings(previewPings),
  );
  const previewHost = $derived(
    anonymousPreviewState.preview
      ? previewNameFromUrl(anonymousPreviewState.preview.url)
      : 'your app',
  );
  const previewStats = $derived(statsFor(previewPings));

  const demoPings = $derived(toChartPings(anonymousPreviewState.demo.pings));
  const demoStatus = $derived<MonitorStatus>(getStatusFromPings(demoPings));
  const demoHost = $derived(
    anonymousPreviewState.demo.monitor?.name ?? 'logdash.io',
  );
  const demoStats = $derived(statsFor(demoPings));

  const activeStepIndex = $derived(
    CREATING_STEPS.findIndex(
      (step) => step.key === anonymousPreviewState.creatingStep,
    ),
  );

  function statsFor(pings: ChartPing[]): TileStat[] {
    const last = pings.at(-1) ?? null;

    return [
      { label: 'Response', value: last ? `${last.responseTimeMs} ms` : '--' },
      { label: 'Status', value: last ? `${last.statusCode}` : '--' },
      { label: 'Checks', value: `${pings.length}` },
    ];
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

  function onRetry(): void {
    anonymousPreviewState.retry();
  }
</script>

<div class="flex w-full flex-col gap-4 px-4 py-4">
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

{#snippet creatingTile()}
  {@render tileHeader('Setting up', 'Building your dashboard', 'unknown')}

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
            <span
              class="loading loading-spinner loading-xs text-primary"
            ></span>
          </span>
        {:else}
          <span
            class="border-neutral-700 size-5 shrink-0 rounded-full border border-dashed"
          ></span>
        {/if}

        <span
          class={[
            'text-sm transition-ink duration-200',
            index <= activeStepIndex ? 'text-base-content' : 'text-neutral-500',
          ]}
        >
          {step.label}
        </span>
      </li>
    {/each}
  </ol>

  <div class="bg-neutral-800 h-[18px] w-full animate-pulse rounded-full"></div>
{/snippet}

{#snippet demoTile()}
  {@render tileHeader('Live monitor', demoHost, demoStatus)}

  {@render tileStats(demoStats)}

  {@render historyBar(
    demoPings,
    'Checking every 15 s',
    demoPings.length ? 'Now' : 'Loading checks',
  )}
{/snippet}

{#snippet previewingTile()}
  {@render tileHeader('Your live monitor', previewHost, previewStatus)}

  {@render tileStats(previewStats)}

  {@render historyBar(
    previewPings,
    'Checking every 15 s during preview',
    previewPings.length ? 'Now' : 'Waiting for the first check',
  )}

  {@render previewActions()}
{/snippet}

{#snippet historyBar(pings: ChartPing[], left: string, right: string)}
  <div class="flex flex-col gap-2">
    {#if pings.length}
      <StatusHistoryBar {pings} height={18} />
    {:else}
      <div
        class="bg-neutral-800 h-[18px] w-full animate-pulse rounded-full"
      ></div>
    {/if}

    {@render tileFooter(left, right)}
  </div>
{/snippet}

{#snippet endedTile()}
  {@render tileHeader('Preview ended', previewHost, 'unknown')}

  <p class="text-neutral-400 text-sm leading-relaxed">
    Preview ended. Open your dashboard to keep monitoring {previewHost}.
  </p>

  {@render previewActions()}
{/snippet}

{#snippet errorTile()}
  {@render tileHeader('Could not start', 'Something got in the way', 'unknown')}

  <p class="text-error/90 text-sm leading-relaxed" role="alert">
    {anonymousPreviewState.error?.message}
  </p>

  <div>
    <button
      type="button"
      class="btn btn-primary btn-sm rounded-full px-5 font-medium"
      data-posthog-id="hero-preview-retry-cta"
      onclick={onRetry}
    >
      Try again
    </button>
  </div>
{/snippet}

{#snippet previewActions()}
  <div class="flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="btn btn-primary btn-sm rounded-full px-5 font-medium"
      data-posthog-id="hero-open-dashboard-cta"
      disabled={isOpening}
      onclick={onOpenDashboard}
    >
      {#if isOpening}
        <span class="loading loading-spinner loading-xs"></span>
      {/if}
      Open your dashboard
      <ArrowRightIcon class="size-4" />
    </button>

    <button
      type="button"
      class="btn btn-subtle btn-sm rounded-full px-4 font-medium"
      data-posthog-id="hero-setup-alerts-cta"
      disabled={isOpening}
      onclick={onOpenDashboard}
    >
      Set up alerts
    </button>
  </div>
{/snippet}

{#snippet tileHeader(eyebrow: string, title: string, status: MonitorStatus)}
  <div class="flex flex-col gap-0.5">
    <span class="text-neutral-500 truncate text-xs">{eyebrow}</span>

    <div class="flex items-center justify-between gap-3">
      <h3 class="min-w-0 truncate text-base font-medium">{title}</h3>

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
