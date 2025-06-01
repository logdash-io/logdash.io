<script lang="ts">
	import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';

	type Props = {
		prompt: string;
	};
	const { prompt }: Props = $props();
</script>

<div
	role="tablist"
	class="tabs tabs-box tabs-sm bg-base-100/70 rounded-lg shadow-none"
>
	<a role="tab" class="tab btn-secondary tab-active w-1/2 rounded-lg">
		Manual
	</a>
	<div class="indicator tab w-1/2">
		<span
			class="indicator-item badge-sm badge-primary badge badge-soft font-bold"
		>
			new
		</span>
		<a
			onclick={() => {
				navigator.clipboard.writeText(prompt);
				toast.success('AI prompt copied to clipboard!');
			}}
			role="tab"
			class="h-full w-full leading-8"
		>
			AI prompt
		</a>
	</div>
</div>
