<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import {
    previewNameFromUrl,
    type AnonymousStartStep,
  } from '$lib/domains/anonymous/domain/anonymous-preview';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings';
  import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
  import SystemHealth from '$lib/landing/SystemHealth.svelte';
  import { StatusBadge, StatusHistoryBar } from '@logdash/hyper-ui/features';
  import { ArrowRightIcon } from 'lucide-svelte';

  type ChartPing = {
    createdAt: string;
    statusCode: number;
    responseTimeMs: number;
  };

  type TileStatus = 'up' | 'down' | 'degraded' | 'unknown';

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
  const previewStatus = $derived<TileStatus>(getStatusFromPings(previewPings));
  const lastPreviewPing = $derived(previewPings.at(-1) ?? null);
  const previewHost = $derived(
    anonymousPreviewState.preview
      ? previewNameFromUrl(anonymousPreviewState.preview.url)
      : 'your app',
  );
  const previewStats = $derived<TileStat[]>([
    {
      label: 'Response',
      value: lastPreviewPing ? `${lastPreviewPing.responseTimeMs} ms` : '--',
    },
    {
      label: 'Status',
      value: lastPreviewPing ? `${lastPreviewPing.statusCode}` : '--',
    },
    { label: 'Checks', value: `${previewPings.length}` },
  ]);

  const demoMonitor = $derived(anonymousPreviewState.demo.monitor);
  const demoPings = $derived(toChartPings(anonymousPreviewState.demo.pings));
  const demoStatus = $derived<TileStatus>(getStatusFromPings(demoPings));
  const lastDemoPing = $derived(demoPings.at(-1) ?? null);
  const demoStats = $derived<TileStat[]>([
    {
      label: 'Response',
      value: lastDemoPing ? `${lastDemoPing.responseTimeMs} ms` : '--',
    },
    { label: 'Uptime', value: toUptime(demoPings) },
    { label: 'Checks', value: `${demoPings.length}` },
  ]);

  const activeStepIndex = $derived(
    CREATING_STEPS.findIndex(
      (step) => step.key === anonymousPreviewState.creatingStep,
    ),
  );

  function toChartPings(pings: HttpPing[]): ChartPing[] {
    return pings
      .map((ping) => ({
        createdAt: new Date(ping.createdAt).toISOString(),
        statusCode: ping.statusCode,
        responseTimeMs: ping.responseTimeMs,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function toUptime(pings: ChartPing[]): string {
    if (!pings.length) {
      return '--';
    }

    const healthy = pings.filter(
      (ping) => ping.statusCode >= 200 && ping.statusCode < 400,
    ).length;

    return `${Math.round((healthy / pings.length) * 100)}%`;
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

<div
  class="ld-card-base flex h-full min-h-64 w-full flex-col justify-between gap-5 rounded-2xl p-5 sm:p-6"
>
  {#if phase === 'creating'}
    {@render creatingTile()}
  {:else if phase === 'previewing'}
    {@render previewingTile()}
  {:else if phase === 'ended'}
    {@render endedTile()}
  {:else if phase === 'error'}
    {@render errorTile()}
  {:else if demoMonitor}
    {@render demoTile()}
  {:else}
    {@render fallbackTile()}
  {/if}
</div>

{#snippet demoTile()}
  {@render tileHeader(
    'Live: our production API',
    demoMonitor?.name ?? '',
    demoStatus,
  )}

  {@render tileStats(demoStats)}

  <div class="flex flex-col gap-2">
    <StatusHistoryBar pings={demoPings} height={18} />

    {@render tileFooter(`${demoPings.length} checks ago`, 'Now')}
  </div>
{/snippet}

{#snippet fallbackTile()}
  {@render tileHeader(
    'Live: our production API',
    'All systems operational',
    'up',
  )}

  <div class="flex flex-1 flex-col justify-center">
    <SystemHealth />
  </div>
{/snippet}

{#snippet creatingTile()}
  {@render tileHeader('Setting up', 'Building your dashboard', 'unknown')}

  <ol class="flex flex-1 flex-col justify-center gap-3">
    {#each CREATING_STEPS as step, index (step.key)}
      <li class="flex items-center gap-3">
        {#if index < activeStepIndex}
          <span
            class="bg-success/15 text-success flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
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
            class="border-base-content/20 size-5 shrink-0 rounded-full border border-dashed"
          ></span>
        {/if}

        <span
          class={[
            'text-sm transition-colors duration-200',
            index <= activeStepIndex
              ? 'text-base-content'
              : 'text-base-content/40',
          ]}
        >
          {step.label}
        </span>
      </li>
    {/each}
  </ol>

  <div class="bg-base-100/60 h-[18px] w-full animate-pulse rounded-full"></div>
{/snippet}

{#snippet previewingTile()}
  {@render tileHeader('Your live monitor', previewHost, previewStatus)}

  {@render tileStats(previewStats)}

  <div class="flex flex-col gap-2">
    {#if previewPings.length}
      <StatusHistoryBar pings={previewPings} height={18} />
    {:else}
      <div
        class="bg-base-100/60 h-[18px] w-full animate-pulse rounded-full"
      ></div>
    {/if}

    {@render tileFooter(
      'Checking every 15 s during preview',
      previewPings.length ? 'Now' : 'Waiting for the first check',
    )}
  </div>

  {@render previewActions()}
{/snippet}

{#snippet endedTile()}
  {@render tileHeader('Preview ended', previewHost, 'unknown')}

  <p class="text-base-content/70 flex-1 text-sm leading-relaxed">
    Preview ended. Open your dashboard to keep monitoring {previewHost}.
  </p>

  {@render previewActions()}
{/snippet}

{#snippet errorTile()}
  {@render tileHeader('Could not start', 'Something got in the way', 'down')}

  <p class="text-base-content/70 flex-1 text-sm leading-relaxed">
    {anonymousPreviewState.error?.message}
  </p>

  <div>
    <button
      type="button"
      class="btn btn-primary btn-sm rounded-full px-5 font-semibold"
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
      class="btn btn-primary btn-sm rounded-full px-5 font-semibold"
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
      class="btn btn-ghost btn-subtle btn-sm rounded-full px-4 font-semibold"
      data-posthog-id="hero-setup-alerts-cta"
      disabled={isOpening}
      onclick={onOpenDashboard}
    >
      Set up alerts
    </button>
  </div>
{/snippet}

{#snippet tileHeader(eyebrow: string, title: string, status: TileStatus)}
  <div class="flex flex-col gap-1">
    <span
      class="text-base-content/40 truncate text-[11px] font-semibold tracking-[0.14em] uppercase"
    >
      {eyebrow}
    </span>

    <div class="flex items-center justify-between gap-3">
      <h3 class="min-w-0 truncate text-lg font-semibold">{title}</h3>

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
        <span
          class="text-base-content/40 text-[11px] font-semibold tracking-[0.1em] uppercase"
        >
          {stat.label}
        </span>
        <span class="truncate text-xl font-semibold tabular-nums">
          {stat.value}
        </span>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet tileFooter(left: string, right: string)}
  <div
    class="text-base-content/40 flex items-center justify-between gap-3 font-mono text-xs"
  >
    <span class="truncate">{left}</span>
    <span class="shrink-0">{right}</span>
  </div>
{/snippet}
