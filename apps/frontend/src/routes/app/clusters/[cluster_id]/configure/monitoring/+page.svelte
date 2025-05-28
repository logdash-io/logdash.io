<script lang="ts">
	import LoggingSetup from '$lib/clusters/projects/ui/setup/LoggingSetup.svelte';
	import MonitoringSetup from '$lib/clusters/projects/ui/setup/MonitoringSetup.svelte';
	import ProjectClaimer from '$lib/clusters/projects/ui/setup/ProjectClaimer.svelte';

	type Props = {
		data: { project_id: string; api_key: string };
	};
	const { data }: Props = $props();
</script>

{#snippet claimer(hasLogs: boolean)}
	<ProjectClaimer canClaim={hasLogs} />
{/snippet}

<MonitoringSetup {claimer} {...data} />
