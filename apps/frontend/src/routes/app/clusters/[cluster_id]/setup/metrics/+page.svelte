<script lang="ts">
	import MetricsSetup from '$lib/clusters/projects/ui/setup/MetricsSetup.svelte';
	import ProjectClaimer from '$lib/clusters/projects/ui/setup/ProjectClaimer.svelte';

	type Props = {
		data: { project_id: string; api_key: string };
	};
	const { data }: Props = $props();
</script>

{#snippet claimer(hasLogs: boolean)}
	<ProjectClaimer canClaim={hasLogs} />
{/snippet}

<MetricsSetup {claimer} {...data} />
