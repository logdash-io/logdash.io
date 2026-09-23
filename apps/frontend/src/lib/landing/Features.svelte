<script lang="ts">
  import { generateDemoData } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import {
    getStatusFromPings,
    MonitorCard,
    StatusBadge,
    type PublicDashboardData,
  } from '@logdash/hyper-ui/features';
  import { SearchIcon } from 'lucide-svelte';
  import FakeLogs from './FakeLogs.svelte';
  import FakeMetricsSparkline from './FakeMetricsSparkline.svelte';
  import FeatureRow from './FeatureRow.svelte';
  import LandingGap from './LandingGap.svelte';
  import LandingHeading from './LandingHeading.svelte';
  import SystemHealth from './SystemHealth.svelte';

  type DemoMonitor = PublicDashboardData['httpMonitors'][number];

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

<LandingHeading
  id="features"
  title="Everything you need to know your app is healthy."
  description="Uptime, status pages, logs and metrics in one dashboard. Start with a URL and add the rest when you need it."
/>

<FeatureRow
  title="Uptime monitoring"
  body="Paste a URL and checks start right away. When something stops answering, you hear about it before your users do."
  href="/features/monitoring"
  linkLabel="Explore monitoring"
  posthogId="features-monitoring-cta"
  checks={[
    'Checks as often as every 15 seconds',
    'Alerts on Telegram or any webhook',
  ]}
  panelHeader={monitoringHeader}
  panel={monitoringPanel}
/>

<LandingGap />

<FeatureRow
  mirrored
  title="Status pages"
  body="Show customers you are up. Uptime history and response times on a page that lives on your own domain."
  href="/features/monitoring"
  linkLabel="Explore status pages"
  posthogId="features-status-pages-cta"
  checks={[
    'Uptime history your customers can check themselves',
    'Served from your own domain',
  ]}
  panelHeader={statusPageHeader}
  panel={statusPagePanel}
/>

<LandingGap />

<FeatureRow
  title="Logs"
  body="Every service in one searchable tail. Filter by level and find the line that broke it."
  href="/features/logging"
  linkLabel="Explore logs"
  posthogId="features-logs-cta"
  checks={[
    'Logs from every service in one place',
    'Search and filter while they stream in',
  ]}
  panelHeader={logsHeader}
  panel={logsPanel}
/>

<LandingGap />

<FeatureRow
  mirrored
  title="Metrics"
  body="Sign-ups, payments, queue depth. Track what matters with one line of code, with nothing to host or maintain."
  href="/features/metrics"
  linkLabel="Explore metrics"
  posthogId="features-metrics-cta"
  checks={[
    'One line of code per metric',
    'Live charts next to your logs and uptime',
  ]}
  panelHeader={metricsHeader}
  panel={metricsPanel}
/>

{#snippet liveStatus()}
  <span
    class="text-neutral-400 ml-auto flex shrink-0 items-center gap-1.5 text-xs"
  >
    <span class="bg-success size-1.5 rounded-full"></span>
    Live
  </span>
{/snippet}

{#snippet monitoringHeader()}
  <span class="font-medium">Your services</span>
  <span class="text-neutral-500 text-xs">Last 45 checks</span>
  <span class="ml-auto shrink-0">
    <StatusBadge status="up" showText={true} />
  </span>
{/snippet}

{#snippet monitoringPanel()}
  <div class="p-5">
    <SystemHealth />
  </div>
{/snippet}

{#snippet statusPageHeader()}
  <span class="text-neutral-500">status.acme.com</span>
  {@render liveStatus()}
{/snippet}

{#snippet statusPagePanel()}
  <div class="flex flex-col gap-1.5 p-4">
    <div class="flex items-center justify-between gap-3 px-1 pt-1 pb-4">
      <div class="flex flex-col gap-0.5">
        <span class="text-base font-medium">Acme status</span>
        <span class="text-neutral-500 text-xs">Updated a few seconds ago</span>
      </div>

      <span
        class="text-warning flex shrink-0 items-center gap-2 text-sm font-medium"
      >
        <span class="bg-warning size-2 rounded-full"></span>
        Partial outage
      </span>
    </div>

    {#each demoMonitors as monitor (monitor.name)}
      <MonitorCard
        {monitor}
        status={getStatusFromPings(monitor.pings)}
        uptime={uptimeFromBuckets(monitor)}
        maxBucketsToShow={60}
        maxPingsToShow={40}
      />
    {/each}
  </div>
{/snippet}

{#snippet logsHeader()}
  <SearchIcon class="text-neutral-600 size-3.5 shrink-0" />
  <span class="text-neutral-500">Search logs</span>
  {@render liveStatus()}
{/snippet}

{#snippet logsPanel()}
  <FakeLogs header={false} padded={true} visible={9} />
{/snippet}

{#snippet metricsHeader()}
  <span class="font-medium">CPU usage</span>
  <span class="text-neutral-500 text-xs">Last 60 s</span>
  {@render liveStatus()}
{/snippet}

{#snippet metricsPanel()}
  <div class="flex h-full p-5">
    <FakeMetricsSparkline />
  </div>
{/snippet}
