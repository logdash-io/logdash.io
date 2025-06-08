<script lang="ts">
	import { page } from '$app/state';
	import ProjectClaimer from '$lib/clusters/common/ui/ProjectClaimer.svelte';
	import MonitoringSetup from '$lib/clusters/monitoring/ui/MonitoringSetup.svelte';

	type Props = {
		data: { project_id: string; api_key: string };
	};
	const { data }: Props = $props();
</script>

{#snippet claimer(hasLogs: boolean)}
	<ProjectClaimer
		nextUrl={`/app/clusters/${page.params.cluster_id}?project_id=${data.project_id}`}
		canClaim={hasLogs}
	/>
{/snippet}

<MonitoringSetup {claimer} {...data} />
