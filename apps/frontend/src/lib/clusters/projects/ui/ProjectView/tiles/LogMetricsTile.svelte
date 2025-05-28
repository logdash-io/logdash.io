<script lang="ts">
	import { logMetricsState } from '$lib/clusters/projects/application/log-metrics.state.svelte';
	import LiveLogMetricsChart from '$lib/clusters/projects/ui/presentational/LogMetricsCharts.svelte';
	import { get_logmetric_granularity } from '$lib/shared/constants/plan-configs';
</script>

<LiveLogMetricsChart
	timeRanges={{
		minute: 1,
		hour: 12,
		day: 7 * 24,
	}}
	logMetrics={logMetricsState.logMetrics}
/>
