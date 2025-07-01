<script lang="ts">
  import { logMetricsState } from '$lib/domains/app/projects/application/log-metrics.state.svelte.js';
  import LiveLogMetricsChart from '$lib/domains/app/projects/ui/presentational/LogMetricsCharts.svelte';
</script>

<LiveLogMetricsChart
  logMetrics={logMetricsState.logMetrics}
  timeRanges={{
    minute: 1,
    hour: 12,
    day: 7 * 24,
  }}
/>
