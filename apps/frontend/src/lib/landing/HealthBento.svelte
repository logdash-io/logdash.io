<script lang="ts">
  import { resolve } from '$app/paths';
  import { generateDemoData } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import {
    getStatusFromPings,
    MonitorCard,
    StatusBadge,
    type PublicDashboardData,
  } from '@logdash/hyper-ui/features';
  import { ArrowRightIcon } from 'lucide-svelte';
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import FakeLogs from './FakeLogs.svelte';
  import FakeMetricsSparkline from './FakeMetricsSparkline.svelte';
  import SystemHealth from './SystemHealth.svelte';

  type DemoMonitor = PublicDashboardData['httpMonitors'][number];
  type TileIcon = Component<{ class?: ClassValue }>;
  type FeatureRoute =
    | '/features/monitoring'
    | '/features/logging'
    | '/features/metrics';

  const HIGHLIGHTS = [
    'Set up in minutes, not a weekend of infrastructure chores.',
    'Clear signal, less noise. Dashboards that need no handbook.',
    'Grows with you, from side project to paying customers.',
  ];

  const demoMonitors = generateDemoData().httpMonitors;

  function uptimeFromBuckets(monitor: DemoMonitor): number {
    const buckets = monitor.buckets.filter((bucket) => bucket !== null);

    const successCount = buckets.reduce(
      (total, bucket) => total + bucket.successCount,
      0,
    );
    const checkCount = buckets.reduce(
      (total, bucket) => total + bucket.successCount + bucket.failureCount,
      0,
    );

    if (!checkCount) {
      return 0;
    }

    return (successCount / checkCount) * 100;
  }
</script>

<section id="health-bento" class="w-full">
  <header class="mx-auto mb-10 max-w-4xl text-center sm:mb-14">
    <h2
      class="text-4xl font-extrabold tracking-tighter text-balance sm:text-5xl"
    >
      Everything you need to know your app is healthy.
    </h2>
  </header>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    {@render wideTile(
      MonitoringIcon,
      'Uptime monitoring',
      'Checks from 15 s. Alerts on Telegram, Discord or any webhook. Public status pages on your domain.',
      '/features/monitoring',
      'Explore monitoring',
      'health-bento-monitoring-cta',
      uptimeVisual,
    )}

    {@render wideTile(
      PublicDashboardIcon,
      'Status pages',
      'Show customers you are up. Uptime history and response times on a page that lives on your own domain.',
      '/features/monitoring',
      'Explore status pages',
      'health-bento-status-pages-cta',
      statusPageVisual,
    )}

    {@render compactTile(
      LogsIcon,
      'Logs',
      'Every service in one searchable tail. Filter by level and find the line that broke it.',
      '/features/logging',
      'Explore logs',
      'health-bento-logs-cta',
      logsVisual,
    )}

    {@render compactTile(
      MetricsIcon,
      'Metrics',
      'Sign-ups, payments, queue depth. One line of code per metric, no Prometheus to babysit.',
      '/features/metrics',
      'Explore metrics',
      'health-bento-metrics-cta',
      metricsVisual,
    )}
  </div>

  <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
    {#each HIGHLIGHTS as highlight (highlight)}
      <div class="ld-card-base flex items-start gap-3 rounded-2xl px-5 py-4">
        <CheckIcon class="text-success mt-0.5 size-5 shrink-0" />

        <span class="text-base-content/80 text-sm leading-relaxed">
          {highlight}
        </span>
      </div>
    {/each}
  </div>
</section>

{#snippet wideTile(
  Icon: TileIcon,
  title: string,
  body: string,
  route: FeatureRoute,
  linkLabel: string,
  posthogId: string,
  visual: Snippet,
)}
  <div
    class="ld-card-base overflow-hidden rounded-3xl md:col-span-2 md:grid md:grid-cols-5"
  >
    <div class="md:col-span-2 md:flex md:items-center">
      {@render tileCopy(Icon, title, body, route, linkLabel, posthogId)}
    </div>

    <div
      class="border-base-100/50 bg-base-300/50 flex items-center border-t p-4 sm:p-5 md:col-span-3 md:border-t-0 md:border-l"
    >
      {@render visual()}
    </div>
  </div>
{/snippet}

{#snippet compactTile(
  Icon: TileIcon,
  title: string,
  body: string,
  route: FeatureRoute,
  linkLabel: string,
  posthogId: string,
  visual: Snippet,
)}
  <div class="ld-card-base flex flex-col overflow-hidden rounded-3xl">
    {@render tileCopy(Icon, title, body, route, linkLabel, posthogId)}

    <div
      class="border-base-100/50 bg-base-300/50 flex flex-1 items-end border-t p-4 sm:p-5"
    >
      {@render visual()}
    </div>
  </div>
{/snippet}

{#snippet tileCopy(
  Icon: TileIcon,
  title: string,
  body: string,
  route: FeatureRoute,
  linkLabel: string,
  posthogId: string,
)}
  <div class="flex flex-col items-start gap-3 p-6 sm:p-8">
    <Icon class="text-primary size-7" />

    <h3 class="text-2xl font-semibold tracking-tight">{title}</h3>

    <p class="text-base-content/70 leading-relaxed">{body}</p>

    <a
      href={resolve(route)}
      class="text-primary hover:text-primary/80 focus-visible:outline-primary/80 mt-1 inline-flex items-center gap-1.5 rounded-full text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4"
      data-posthog-id={posthogId}
    >
      {linkLabel}
      <ArrowRightIcon class="size-4" />
    </a>
  </div>
{/snippet}

{#snippet uptimeVisual()}
  <div class="ld-card-base flex w-full flex-col gap-4 rounded-2xl p-5 sm:p-6">
    <div class="flex flex-col gap-1">
      <span
        class="text-base-content/40 text-[11px] font-semibold tracking-[0.14em] uppercase"
      >
        Last 45 checks
      </span>

      <div class="flex items-center justify-between gap-3">
        <h4 class="text-lg font-semibold">Your services</h4>

        <div class="shrink-0">
          <StatusBadge status="up" showText={true} />
        </div>
      </div>
    </div>

    <SystemHealth />
  </div>
{/snippet}

{#snippet statusPageVisual()}
  <div class="flex w-full flex-col gap-1.5">
    {#each demoMonitors as monitor (monitor.name)}
      <MonitorCard
        {monitor}
        status={getStatusFromPings(monitor.pings)}
        uptime={uptimeFromBuckets(monitor)}
        maxBucketsToShow={90}
        maxPingsToShow={60}
      />
    {/each}
  </div>
{/snippet}

{#snippet logsVisual()}
  <FakeLogs />
{/snippet}

{#snippet metricsVisual()}
  <FakeMetricsSparkline />
{/snippet}
