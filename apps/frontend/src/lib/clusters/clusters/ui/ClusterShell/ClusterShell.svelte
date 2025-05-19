<script lang="ts">
	import type { Snippet } from 'svelte';
	import ClusterNav from './ClusterNav.svelte';

	type Props = {
		children: Snippet;
	};
	const { children }: Props = $props();
</script>

<div class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0">
	<ClusterNav />

	<div class="xl:w-7xl mx-auto flex h-full max-h-full w-full">
		<div class="relative flex h-full w-full flex-col items-center">
			{@render children()}
		</div>
	</div>
</div>
