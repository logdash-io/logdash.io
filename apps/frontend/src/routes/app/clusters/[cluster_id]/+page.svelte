<script lang="ts">
	import { page } from '$app/state';
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
	import ClusterView from '$lib/clusters/clusters/ui/ClusterView/ClusterView.svelte';
	import { logsState } from '$lib/clusters/projects/application/logs.state.svelte.js';
	import { metricsState } from '$lib/clusters/projects/application/metrics.state.svelte.js';
	import { monitoringState } from '$lib/clusters/projects/application/monitoring.state.svelte.js';
	import type { Log } from '$lib/clusters/projects/domain/log.js';
	import type { Metric } from '$lib/clusters/projects/domain/metric.js';
	import type { Monitor } from '$lib/clusters/projects/domain/monitoring/monitor.js';
	import type { Project } from '$lib/clusters/projects/domain/project';

	type Props = {
		data: {
			projects: Project[];
			clusters: Cluster[];
			initialLogs: Log[];
			initialMetrics: Metric[];
			initialMonitors: Monitor[];
		};
	};
	const { data }: Props = $props();
	const originalClusterName = data.clusters.find(
		(p) => p.id === page.params.cluster_id,
	)?.name;
	const clusterName = clustersState.clusterName(page.params.cluster_id);

	$effect(() => {
		logsState.set(data.initialLogs);
		metricsState.set(data.initialMetrics);
		monitoringState.set(data.initialMonitors);
	});

	// todo: check if user is claimed with api request before rendering, otherwise redirect to setup
</script>

<svelte:head>
	<title>{clusterName || originalClusterName} | logdash</title>
</svelte:head>

<ClusterView />
