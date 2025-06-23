<script lang="ts">
	export let title: string;
	export let currentRange: string;
	export let smallOption: string;
	export let largeOption: string;
	export let isPaidTier: boolean;
	export let onRangeChange: (range: string) => void;
</script>

<div class="flex justify-between items-center mb-4">
	<h2 class="text-xl font-semibold">{title}</h2>
	<div
		role="tablist"
		class="tabs tabs-box tabs-sm bg-base-100/70 rounded-lg shadow-none"
	>
		<button 
			role="tab" 
			class="tab {currentRange === smallOption ? 'tab-active btn-secondary' : ''} w-28 rounded-lg"
			onclick={() => onRangeChange(smallOption)}
		>
			{smallOption}
		</button>
		<button 
			role="tab" 
			class="tab {currentRange === largeOption ? 'tab-active btn-secondary' : ''} w-28 rounded-lg"
			onclick={() => onRangeChange(largeOption)}
		>
			{largeOption}
		</button>

	</div>
</div> 