<script lang="ts">
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
	import ClustersList from '$lib/clusters/clusters/ui/ClustersList/ClustersList.svelte';
	import type { Project } from '$lib/clusters/projects/domain/project';
	import ProjectsList from '$lib/clusters/projects/ui/ProjectsList/ProjectsList.svelte';
	import { get_max_number_of_projects } from '$lib/shared/constants/plan-configs';
	import type { User } from '$lib/shared/user/domain/user';
	import type { Snippet } from 'svelte';

	type Props = {
		data: {
			clusters: Cluster[];
			user: User;
		};
		children: Snippet;
	};
	const { data, children }: Props = $props();
</script>

<svelte:head>
	<title>all_clusters | logdash</title>
</svelte:head>

<ClustersList
	canCreate={clustersState.allClustersProjectsCount <
		get_max_number_of_projects(data.user.tier)}
/>
<!-- {JSON.stringify(data.clusters)} -->
<!-- <ProjectsList
	canCreate={data.projects.length <
		get_max_number_of_projects(data.user.tier)}
/> -->
