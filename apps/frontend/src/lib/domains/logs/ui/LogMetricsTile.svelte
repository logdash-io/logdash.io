<script lang="ts">
  import { logMetricsState } from '$lib/domains/logs/application/log-metrics.state.svelte.js';
  import LiveLogMetricsChart from '$lib/domains/logs/ui/LogMetricsCharts.svelte';
</script>

<LiveLogMetricsChart
  logMetrics={logMetricsState.logMetrics}
  timeRanges={{
    minute: 1,
    hour: 12,
    day: 7 * 24,
  }}
/>
