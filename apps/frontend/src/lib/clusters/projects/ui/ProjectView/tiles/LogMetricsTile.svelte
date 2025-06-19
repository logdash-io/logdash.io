<script lang="ts">
  import { logMetricsState } from '$lib/clusters/projects/application/log-metrics.state.svelte';
  import LiveLogMetricsChart from '$lib/clusters/projects/ui/presentational/LogMetricsCharts.svelte';
</script>

<LiveLogMetricsChart
  logMetrics={logMetricsState.logMetrics}
  timeRanges={{
		minute: 1,
		hour: 12,
		day: 7 * 24,
	}}
/>
