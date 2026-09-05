<script lang="ts">
  import { resolve } from '$app/paths';
  import { generateDemoData } from '$lib/domains/app/projects/domain/status-page-demo-data';
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
  import LandingSection from './LandingSection.svelte';
  import SystemHealth from './SystemHealth.svelte';

  type DemoMonitor = PublicDashboardData['httpMonitors'][number];
  type TileIcon = Component<{ class?: ClassValue }>;
  type FeatureRoute =
    | '/features/monitoring'
    | '/features/logging'
    | '/features/metrics';

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

<!--
  The umbrella heading is a band of its own, then every feature
  is its own section under a full-width hairline. Copy sits on the column with
  the demo beside it, no surface. Logs and Metrics share the last row, split by
  a vertical hairline.
-->
<LandingSection id="health-bento">
  <header class="px-4 py-16 text-center sm:px-6 lg:px-10 lg:py-20">
    <h2
      class="mx-auto max-w-3xl text-3xl font-medium tracking-[-0.03em] text-balance sm:text-4xl"
    >
      Everything you need to know your app is healthy.
    </h2>
  </header>
</LandingSection>

{@render wideRow(
  MonitoringIcon,
  'Uptime monitoring',
  'Checks from 15 s. Alerts on Telegram or any webhook. Public status pages on your domain.',
  '/features/monitoring',
  'Explore monitoring',
  'health-bento-monitoring-cta',
  uptimeVisual,
  false,
)}

{@render wideRow(
  PublicDashboardIcon,
  'Status pages',
  'Show customers you are up. Uptime history and response times on a page that lives on your own domain.',
  '/features/monitoring',
  'Explore status pages',
  'health-bento-status-pages-cta',
  statusPageVisual,
  true,
)}

<LandingSection>
  <div
    class="divide-hairline grid grid-cols-1 divide-y px-4 py-12 sm:px-6 md:grid-cols-2 md:divide-x md:divide-y-0 lg:px-10 lg:py-16"
  >
    <div class="pb-10 md:pr-10 md:pb-0">
      {@render compactTile(
        LogsIcon,
        'Logs',
        'Every service in one searchable tail. Filter by level and find the line that broke it.',
        '/features/logging',
        'Explore logs',
        'health-bento-logs-cta',
        logsVisual,
      )}
    </div>

    <div class="pt-10 md:pt-0 md:pl-10">
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
  </div>
</LandingSection>

{#snippet wideRow(
  Icon: TileIcon,
  title: string,
  body: string,
  route: FeatureRoute,
  linkLabel: string,
  posthogId: string,
  visual: Snippet,
  mirrored: boolean,
)}
  <LandingSection>
    <div
      class="grid grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-5 md:gap-10 lg:px-10 lg:py-16"
    >
      <div class={['md:col-span-2', { 'md:order-last': mirrored }]}>
        {@render tileCopy(Icon, title, body, route, linkLabel, posthogId)}
      </div>

      <div class="flex items-start md:col-span-3">
        {@render visual()}
      </div>
    </div>
  </LandingSection>
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
  <div class="flex h-full flex-col gap-8">
    {@render tileCopy(Icon, title, body, route, linkLabel, posthogId)}

    <div class="flex">
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
  <div class="flex flex-col items-start gap-3">
    <Icon class="size-7" />

    <h3 class="text-xl font-medium tracking-tight">{title}</h3>

    <p class="text-neutral-400 leading-relaxed">{body}</p>

    <a
      href={resolve(route)}
      class="text-base-content hover:text-neutral-400 focus-visible:outline-neutral-500 mt-1 inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-ink duration-150 focus-visible:outline-2 focus-visible:outline-offset-4"
      data-posthog-id={posthogId}
    >
      {linkLabel}
      <ArrowRightIcon class="size-4" />
    </a>
  </div>
{/snippet}

{#snippet uptimeVisual()}
  <div class="flex w-full flex-col gap-5">
    <div class="flex flex-col gap-1">
      <span class="text-neutral-600 text-xs">Last 45 checks</span>

      <div class="flex items-center justify-between gap-3">
        <h4 class="text-base font-medium">Your services</h4>

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
  <FakeLogs padded={false} />
{/snippet}

{#snippet metricsVisual()}
  <FakeMetricsSparkline />
{/snippet}
