<script lang="ts">
	import type { Log } from '$lib/clusters/projects/domain/log';
	import LogRow from '$lib/shared/ui/components/LogRow.svelte';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';

	const { logs = [] }: { logs: Log[] } = $props();
	let rendered = $state(false);

	onMount(() => {
		const t = setTimeout(() => {
			rendered = true;
		}, 500);

		return () => {
			clearTimeout(t);
		};
	});
</script>

{#if logs.length > 0}
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold">Project logs</h2>

			<span class="loading loading-ring loading-sm"></span>
		</div>

		<div class="flex max-h-96 flex-col-reverse overflow-auto">
			<ul class="list-inside list-none break-all">
				{#each logs as log, index (log.id)}
					<li
						in:scale|global={{
							start: 0.95,
							duration: 200,
							delay: !rendered ? 5 * index : 0,
						}}
					>
						<!-- <LogRow
							prefix="short"
							date={log.createdAt}
							level={log.level}
							message={log.message}
						/> -->
					</li>
				{/each}
			</ul>
		</div>
	</div>
{:else}
	<div
		class="text-primary mx-auto flex items-center justify-center gap-2 font-semibold opacity-90"
	>
		<span class="loading loading-ring loading-xl"></span>
		Listening for logs...
	</div>
{/if}
