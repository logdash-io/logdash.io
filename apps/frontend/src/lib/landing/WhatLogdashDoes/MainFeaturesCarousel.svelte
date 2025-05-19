<script lang="ts">
	import LogRow from '$lib/shared/ui/components/LogRow.svelte';
	import LoggerCarouselItem from './LoggerCarouselItem.svelte';

	const loggerFeatures = [
		'Collect, store, and visualize application logs in one place',
		'Find critical information quickly with powerful search tools',
		'Eliminate multi-instance clutter with centralized logging',
		'Debug faster with intuitive visualization tools',
	];
</script>

<div class="mx-auto flex max-w-4xl flex-col gap-14 px-2">
	<div
		class="tabs tabs-box mx-auto w-full flex-col gap-4 lg:w-fit lg:flex-row lg:gap-0"
	>
		<div class="indicator mx-auto w-1/2 lg:w-fit">
			<span
				class="indicator-item indicator-center indicator-bottom badge badge-primary badge-xs badge-soft font-semibold uppercase"
			>
				new
			</span>

			<input
				type="radio"
				name="my_tabs_1"
				class="tab w-full"
				aria-label="Logging"
				checked={true}
			/>
		</div>

		<div class="indicator mx-auto w-1/2 lg:w-fit">
			<span
				class="indicator-item indicator-center indicator-bottom badge badge-success badge-xs badge-soft font-semibold uppercase"
			>
				Coming soon
			</span>

			<input
				type="radio"
				name="my_tabs_1"
				class="tab w-full"
				aria-label="Metrics collection"
				disabled
			/>
		</div>

		<div class="indicator mx-auto w-1/2 lg:w-fit">
			<span
				class="indicator-item indicator-center indicator-bottom badge badge-success badge-xs badge-soft font-semibold uppercase"
			>
				Coming soon
			</span>

			<input
				type="radio"
				name="my_tabs_1"
				class="tab w-full"
				aria-label="System health"
				disabled
			/>
		</div>
	</div>

	<div class="carousel w-full">
		<LoggerCarouselItem />

		<!-- <div id="item2" class="carousel-item w-full">
			<img
				src="https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp"
				class="w-full"
			/>
		</div>
		<div id="item3" class="carousel-item w-full">
			<img
				src="https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp"
				class="w-full"
			/>
		</div>
		<div id="item4" class="carousel-item w-full">
			<img
				src="https://img.daisyui.com/images/stock/photo-1665553365602-b2fb8e5d1707.webp"
				class="w-full"
			/>
		</div> -->
	</div>
</div>
