<script lang="ts">
  import FakeLogSearch from './FakeLogSearch.svelte';
  import FakeMetricsSparkline from './FakeMetricsSparkline.svelte';
  import FakeStatusPage from './FakeStatusPage.svelte';
  import FakeUptimeChart from './FakeUptimeChart.svelte';
  import FeatureRow from './FeatureRow.svelte';
  import LandingGap from './LandingGap.svelte';
  import LandingHeading from './LandingHeading.svelte';
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
  <span class="font-medium">api.acme.com</span>
  <span class="text-neutral-500 text-xs">Every 15 s</span>
  {@render liveStatus()}
{/snippet}

{#snippet monitoringPanel()}
  <div class="flex h-full p-5">
    <FakeUptimeChart />
  </div>
{/snippet}

{#snippet statusPageHeader()}
  <span class="text-neutral-500">status.acme.com</span>
  {@render liveStatus()}
{/snippet}

{#snippet statusPagePanel()}
  <div class="flex h-full p-5">
    <FakeStatusPage />
  </div>
{/snippet}

{#snippet logsPanel()}
  <FakeLogSearch />
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
