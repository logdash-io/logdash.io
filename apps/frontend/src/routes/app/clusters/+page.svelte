<script lang="ts">
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
	import ClustersList from '$lib/clusters/clusters/ui/ClustersList/ClustersList.svelte';
	import { get_max_number_of_projects } from '$lib/shared/constants/plan-configs';
	import type { User } from '$lib/shared/user/domain/user';

	type Props = {
		data: {
			clusters: Cluster[];
			user: User;
		};
	};
	const { data }: Props = $props();
</script>

<svelte:head>
	<title>all_clusters | logdash</title>
</svelte:head>

<ClustersList
	canCreate={clustersState.allClustersProjectsCount <
		get_max_number_of_projects(data.user.tier)}
/>
