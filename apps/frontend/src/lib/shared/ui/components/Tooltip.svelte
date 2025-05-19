<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import type { ClassValue } from 'svelte/elements';
	import { fly } from 'svelte/transition';

	type Props = {
		content: any;
		placement: 'top' | 'bottom';
		children: Snippet;
		class?: ClassValue;
	};
	const { children, class: className, content, placement }: Props = $props();

	let wrapper: HTMLSpanElement;
	let tooltip: HTMLDivElement = $state(null);

	let visible = $state(false);
	let coords = { top: 0, left: 0 };

	function show() {
		visible = true;
		tick().then(positionTooltip);
	}

	function hide() {
		visible = false;
	}

	function positionTooltip() {
		// document.body.appendChild(tooltip);
		const triggerRect = wrapper.getBoundingClientRect();
		const tooltipRect = tooltip.getBoundingClientRect();

		coords = {
			top:
				placement === 'top'
					? triggerRect.top - tooltipRect.height - 8
					: triggerRect.bottom + 8,
			left:
				triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
		};

		tooltip.style.top = coords.top + 'px';
		tooltip.style.left = coords.left + 'px';
	}

	$effect(() => {
		wrapper.addEventListener('mouseenter', show);
		wrapper.addEventListener('mouseleave', hide);

		return () => {
			wrapper.removeEventListener('mouseenter', show);
			wrapper.removeEventListener('mouseleave', hide);
		};
	});
</script>

<span class={className} bind:this={wrapper}>
	{@render children()}
</span>

{#if visible}
	<div
		transition:fly={{ y: 5, easing: cubicInOut, duration: 200 }}
		bind:this={tooltip}
		class="bg-base-100 fixed z-50 rounded-lg px-3 py-1 text-sm text-white shadow"
		style="top: 0; left: 0"
	>
		{content}
	</div>
{/if}
