<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import MonitoringSetup from '$lib/clusters/projects/ui/setup/MonitoringSetup.svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		data: { project_id: string; api_key: string };
	};
	const { data }: Props = $props();
	let tryingToClaim = $state(false);
	const url = $derived(page.url.searchParams.get('url'));
	const name = $derived(page.url.searchParams.get('name'));
</script>

{#snippet claimer(hasLogs: boolean)}
	<div class="mt-auto flex items-center gap-4">
		<button
			onclick={() => {
				tryingToClaim = true;

				goto(
					`/app/api/clusters/${page.params.cluster_id}/monitors/create?project_id=${data.project_id}&url=${url}&name=${name}`,
					{
						invalidateAll: true,
					},
				);
			}}
			in:fade={{ duration: 100 }}
			class={['btn btn-primary flex-1 whitespace-nowrap']}
			disabled={!hasLogs || tryingToClaim}
			data-posthog-id="complete-setup-button"
		>
			{#if tryingToClaim}
				<span class="loading loading-xs"></span>
			{/if}
			Complete setup
		</button>
	</div>
{/snippet}

<MonitoringSetup {claimer} {...data} />
