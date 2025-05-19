<script lang="ts">
	import LogRow from '$lib/shared/ui/components/LogRow.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import SimulatedLogsList from './SimulatedLogsList.svelte';
	import SimulatedLogMetricsTile from './SimulatedLogMetricsTile.svelte';

	const loggerFeatures = [
		'Collect, store, and visualize application logs in one place',
		// 'Find critical information quickly with powerful search tools',
		'Eliminate multi-instance clutter with centralized logging',
		'Debug faster with intuitive visualization tools',
	];

	let activeItem = $state(0);

	onMount(() => {
		const interval = setInterval(() => {
			activeItem =
				activeItem === loggerFeatures.length - 1 ? 0 : activeItem + 1;
		}, 12000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="carousel-item flex w-full flex-col gap-4 lg:flex-row">
	<ul class="list ld-card-base rounded-box shadow-md">
		<li class="p-4 pb-2 tracking-wide">
			Your Single Source of Truth for Logs
		</li>

		{#each loggerFeatures as feature, index}
			<li
				class={[
					'list-row cursor-pointer',
					{
						'text-primary': activeItem === index,
						'text-secondary': activeItem !== index,
					},
				]}
				onclick={() => (activeItem = index)}
				role="button"
			>
				<div
					class={[
						'shrink-0 text-4xl font-thin tabular-nums',
						{
							'opacity-30': activeItem !== index,
						},
					]}
				>
					0{index + 1}
				</div>

				<div
					class={[
						'list-col-grow',
						{
							'opacity-60': activeItem !== index,
						},
					]}
				>
					{feature}
				</div>
			</li>
		{/each}
	</ul>

	<div class="relative h-96 w-full overflow-auto rounded-xl">
		{#if activeItem === 0}
			<div in:fade={{ duration: 300 }} class="ld-card">
				<SimulatedLogsList />
			</div>
		{:else if activeItem === 1}
			<div
				in:fade={{ duration: 300 }}
				class="bg-base-200 flex flex-col gap-1.5 rounded-xl border-t border-l border-gray-100/10 shadow-2xl lg:py-6"
			>
				<video
					class="rounded-xl"
					src="/videos/LoggerInstances.mp4"
					muted
					playsinline
					loop
					autoplay
				></video>
			</div>
		{:else if activeItem === 2}
			<div
				in:fade={{ duration: 300 }}
				class="bg-base-200 flex flex-col gap-1.5 rounded-xl border-t border-l border-gray-100/10 p-8 py-6 shadow-2xl lg:p-6"
			>
				<SimulatedLogMetricsTile />
			</div>
		{:else if activeItem === 3}
			<div
				in:fade={{ duration: 100 }}
				class="bg-base-200 flex flex-col gap-1.5 rounded-xl border-t border-l border-gray-100/10 p-8 py-6 shadow-2xl lg:pt-6"
			>
				<h5 class="mb-2 text-center text-lg">Recent Logs</h5>

				{#each [] as log}
					<LogRow
						date={new Date(log.timestamp)}
						level={log.level}
						message={log.message}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
