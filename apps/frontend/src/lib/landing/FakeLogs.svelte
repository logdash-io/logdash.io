<script lang="ts">
	import LogRow from '$lib/domains/shared/ui/components/LogRow.svelte';
	import { FAKE_LOGS } from './data/logs.mock';
</script>

<div
	class="bg-base-200 flex flex-col gap-1.5 rounded-xl border-t border-l border-gray-100/10 p-8 py-6 shadow-2xl lg:pt-6"
>
	<h5 class="mb-2 text-center text-lg">Recent Logs</h5>

	{#each FAKE_LOGS.slice(0, 6) as log}
		<LogRow
			prefix="short"
			date={new Date(log.timestamp)}
			level={log.level}
			message={log.message}
		/>
	{/each}
</div>
