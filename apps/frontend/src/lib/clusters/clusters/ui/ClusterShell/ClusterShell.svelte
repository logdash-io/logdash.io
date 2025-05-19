<script lang="ts">
	import { page } from '$app/state';
	import AnimatedView from '$lib/shared/ui/AnimatedView.svelte';
	import type { Snippet } from 'svelte';
	import ClusterNav from './ClusterNav.svelte';

	type Props = {
		children: Snippet;
	};
	const { children }: Props = $props();
</script>

<!-- <AnimatedView
	offsetRight={page.url.pathname.includes('/setup') && 'xl:w-xl w-md'}
	class={['mx-auto flex h-full w-full flex-col gap-4 p-4 xl:w-7xl']}
> -->
<div class="relative mx-auto flex h-full w-full flex-col gap-4 p-4 pt-0 lg:p-0">
	<ClusterNav />

	<div class="mx-auto flex h-full max-h-full w-full xl:w-7xl">
		<div class="relative flex h-full w-full flex-col items-center">
			{@render children()}
		</div>
	</div>
</div>
<!-- </AnimatedView> -->
