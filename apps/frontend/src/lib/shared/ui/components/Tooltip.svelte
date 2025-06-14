<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import type { ClassValue } from 'svelte/elements';
	import { fly } from 'svelte/transition';

	type Props = {
		content: string | Snippet<[() => void]>;
		placement: 'top' | 'bottom';
		children: Snippet;
		class?: ClassValue;
		trigger?: 'hover' | 'click';
		interactive?: boolean;
		align?: 'left' | 'center' | 'right';
	};
	const {
		children,
		class: className,
		content,
		placement,
		trigger = 'hover',
		interactive = false,
		align = 'center',
	}: Props = $props();

	let wrapper: HTMLSpanElement;
	let tooltip: HTMLDivElement = $state(null);

	let visible = $state(false);
	let coords = { top: 0, left: 0 };
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function show() {
		// Clear any pending hide timeout
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
		visible = true;
		tick().then(positionTooltip);
	}

	function hide() {
		// Only add delay for interactive tooltips on hover trigger
		if (interactive && trigger === 'hover') {
			hideTimeout = setTimeout(() => {
				visible = false;
				hideTimeout = null;
			}, 200); // 300ms delay
		} else {
			visible = false;
		}
	}

	function toggle() {
		if (visible) {
			hide();
		} else {
			show();
		}
	}

	function handleClick(event: MouseEvent) {
		if (trigger === 'click') {
			event.stopPropagation();
			toggle();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			trigger === 'click' &&
			visible &&
			tooltip &&
			!tooltip.contains(event.target as Node) &&
			!wrapper.contains(event.target as Node)
		) {
			hide();
		}
	}

	function positionTooltip() {
		const triggerRect = wrapper.getBoundingClientRect();
		const tooltipRect = tooltip.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const margin = 8;

		// Calculate initial position
		let top =
			placement === 'top'
				? triggerRect.top - tooltipRect.height - margin
				: triggerRect.bottom + margin;

		// Calculate horizontal position based on align prop
		let left: number;
		switch (align) {
			case 'left':
				left = triggerRect.left;
				break;
			case 'right':
				left = triggerRect.right - tooltipRect.width;
				break;
			case 'center':
			default:
				left =
					triggerRect.left +
					(triggerRect.width - tooltipRect.width) / 2;
				break;
		}

		// Adjust horizontal position to stay within screen bounds
		if (left < margin) {
			left = margin;
		} else if (left + tooltipRect.width > viewportWidth - margin) {
			left = viewportWidth - tooltipRect.width - margin;
		}

		// Adjust vertical position to stay within screen bounds
		if (top < margin) {
			// If tooltip would go above screen, show it below the trigger instead
			top = triggerRect.bottom + margin;
		} else if (top + tooltipRect.height > viewportHeight - margin) {
			// If tooltip would go below screen, show it above the trigger instead
			top = triggerRect.top - tooltipRect.height - margin;
		}

		coords = { top, left };

		tooltip.style.top = coords.top + 'px';
		tooltip.style.left = coords.left + 'px';
	}

	$effect(() => {
		if (trigger === 'hover') {
			wrapper.addEventListener('mouseenter', show);
			wrapper.addEventListener('mouseleave', hide);

			if (interactive && tooltip) {
				tooltip.addEventListener('mouseenter', show);
				tooltip.addEventListener('mouseleave', hide);
			}
		} else if (trigger === 'click') {
			wrapper.addEventListener('click', handleClick);
			document.addEventListener('click', handleClickOutside);
		}

		return () => {
			// Clear any pending timeout on cleanup
			if (hideTimeout) {
				clearTimeout(hideTimeout);
				hideTimeout = null;
			}

			if (trigger === 'hover') {
				wrapper.removeEventListener('mouseenter', show);
				wrapper.removeEventListener('mouseleave', hide);

				if (interactive && tooltip) {
					tooltip.removeEventListener('mouseenter', show);
					tooltip.removeEventListener('mouseleave', hide);
				}
			} else if (trigger === 'click') {
				wrapper.removeEventListener('click', handleClick);
				document.removeEventListener('click', handleClickOutside);
			}
		};
	});
</script>

<span class={['flex', className]} bind:this={wrapper}>
	{@render children()}
</span>

{#if visible}
	{@const isSnippet = typeof content === 'function'}
	<div
		transition:fly={{ y: 5, easing: cubicInOut, duration: 200 }}
		bind:this={tooltip}
		class={[
			'fixed z-50',
			{
				'bg-base-100 rounded-lg px-3 py-1 text-sm text-white shadow':
					!isSnippet,
			},
		]}
		style="top: 0; left: 0"
		onclick={(e) => e.stopPropagation()}
	>
		{#if isSnippet}
			{@render content(() => {
				visible = false;
			})}
		{:else}
			{content}
		{/if}
	</div>
{/if}
