<script lang="ts">
	import { page } from '$app/state';
	import ProjectClaimer from '$lib/clusters/projects/ui/setup/ProjectClaimer.svelte';
	import MonitoringSetup from '$lib/clusters/projects/ui/setup/MonitoringSetup.svelte';

	type Props = {
		data: { project_id: string; api_key: string };
	};
	const { data }: Props = $props();
	const url = $derived(page.url.searchParams.get('url'));
	const name = $derived(page.url.searchParams.get('name'));
</script>

{#snippet claimer(hasLogs: boolean)}
	<ProjectClaimer
		nextUrl={`/app/api/clusters/${page.params.cluster_id}/monitors/create?project_id=${data.project_id}&url=${url}&name=${name}`}
		canClaim={hasLogs}
	/>
{/snippet}

<MonitoringSetup {claimer} {...data} />
