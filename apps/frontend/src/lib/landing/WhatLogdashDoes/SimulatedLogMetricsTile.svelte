<script lang="ts">
	import LiveLogMetricsChart from '$lib/clusters/projects/ui/presentational/LiveLogMetricsChart.svelte';
	import { FAKE_LOG_METRICS } from '../data/log-metrics.mock';
</script>

<LiveLogMetricsChart
	logMetrics={FAKE_LOG_METRICS}
	timeRanges={{
		minute: 1,
		hour: 12,
		day: 7 * 24,
	}}
/>
