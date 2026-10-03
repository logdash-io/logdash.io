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
  title="Know the moment it goes down."
  description="Uptime checks and a public status page. Start with a URL and add the rest when you need it."
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
  body="Show customers you are up. Uptime history and response times on a public page, hosted by us or built by you."
  href="/features/monitoring"
  hash="status-pages"
  linkLabel="Explore status pages"
  posthogId="features-status-pages-cta"
  checks={[
    'Uptime history your customers can check themselves',
    'Your own domain on Pro, or your own page on the API',
  ]}
  panelHeader={statusPageHeader}
  panel={statusPagePanel}
/>

<LandingHeading
  title="Know why it went down."
  description="Error logs and response times sit next to your monitors, so the alert and its cause are one click apart."
/>

<FeatureRow
  title="Error logs"
  body="Every service in one searchable tail. Filter to errors and find the line that broke it."
  href="/features/logging"
  linkLabel="Explore error logs"
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
  title="Response time and metrics"
  body="Every check records how long your server took to answer. Add sign-ups, payments or queue depth with one line of code."
  href="/features/metrics"
  linkLabel="Explore response time"
  posthogId="features-metrics-cta"
  checks={[
    'Response time on every uptime check',
    'One line of code per custom metric',
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
