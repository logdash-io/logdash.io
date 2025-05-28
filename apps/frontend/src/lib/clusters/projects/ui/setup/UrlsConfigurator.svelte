<script lang="ts">
	import { MinusIcon, PlusCircle, PlusIcon } from 'lucide-svelte';

	type Props = {
		urls: string[];
	};
	let { urls = $bindable(['']) }: Props = $props();
	let submittedUrls = $state<string[]>(urls);

	const isUrlValid = (url: string) => {
		const pattern = new RegExp(
			'^(https?:\\/\\/)??' + // protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+([a-z]{2,}|[a-z\\d-]{2,}))' + // domain name
				'(:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
				'(#[a-z\\d_.~+=-]*)?$',
			'i',
		);
		return !!pattern.test(url);
	};
</script>

<div class="space-y-2">
	{#each submittedUrls as url, index (index)}
		<div class="flex items-center gap-2">
			<input
				type="url"
				placeholder="https://your-service.com/health"
				class={[
					'input-sm selection:bg-secondary/20 h-full w-full rounded-lg px-4 py-3 text-lg outline-0 transition-all duration-200 focus:bg-transparent',
					{
						'input-error': !isUrlValid(url),
						'input-success focus:border-secondary/20':
							isUrlValid(url),
					},
				]}
				bind:value={submittedUrls[index]}
			/>
			{#if urls.length > 1}
				<button
					class="btn btn-square btn-ghost btn-sm p-1"
					onclick={() => submittedUrls.splice(index, 1)}
					title="Remove URL"
				>
					<MinusIcon class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/each}

	<button
		class="btn btn-secondary mt-2 flex w-full items-center gap-2"
		onclick={() => {
			submittedUrls.push('');
		}}
		title="Add URL"
	>
		<PlusIcon class="h-4 w-4" />
		Add URL
	</button>
</div>
