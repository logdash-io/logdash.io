<script lang="ts">
	import { clickShortcut } from '$lib/shared/ui/actions/click-shortcut.svelte.js';
	import { isValidUrl, tryPrependProtocol } from '$lib/shared/utils/url.js';
	import { ArrowRightIcon, CheckIcon, XIcon } from 'lucide-svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Props = {
		canAddMore: boolean;
		delayIn?: number;
		delayOut?: number;
		onSubmit: (name: string) => void;
	};
	const { onSubmit }: Props = $props();

	const MIN_NAME_LENGTH = 3;
	const MAX_NAME_LENGTH = 30;

	let configuringUrl = $state(false);
	let url = $state('');
	// svelte-ignore non_reactive_update
	let inputRef;

	$effect(() => {
		if (configuringUrl) {
			url = '';
			inputRef?.focus();
		}
	});

	const urlValid = $derived(isValidUrl(url));
</script>

<div class="relative z-20 flex">
	<button
		in:fly={{ y: -2, duration: 100 }}
		onclick={() => {
			configuringUrl = true;
		}}
		class="btn btn-secondary btn-xs gap-1 opacity-90"
	>
		Setup monitoring <ArrowRightIcon class="h-4 w-4" />
	</button>

	{#if configuringUrl}
		<div
			in:fly={{ y: 5, duration: 200, easing: cubicOut }}
			out:fly={{ y: 5, duration: 200, easing: cubicOut }}
			class={[
				'ld-card-base ring-base-100 absolute right-0 top-full mt-2 flex h-20 w-96 items-center justify-between gap-2 rounded-xl pr-6 shadow-xl ring transition-colors',
				{
					'focus-within:ring-success/50': urlValid,
					'focus-within:ring-primary/50': !urlValid,
				},
			]}
		>
			<input
				bind:this={inputRef}
				bind:value={url}
				minlength={MIN_NAME_LENGTH}
				maxlength={MAX_NAME_LENGTH}
				class="input-sm input-ghost selection:bg-secondary/20 h-full w-full rounded-lg pl-6 text-lg font-semibold outline-0 focus:bg-transparent"
				placeholder="Url to watch"
			/>

			<button
				disabled={!urlValid}
				class="btn btn-success btn-soft btn-sm btn-square"
				onclick={() => {
					onSubmit(tryPrependProtocol(url));
					configuringUrl = false;
				}}
				use:clickShortcut={{ key: 'Enter' }}
			>
				<CheckIcon class="h-4 w-4" />
			</button>

			<button
				class="btn btn-error btn-soft btn-sm btn-square"
				onclick={() => (configuringUrl = false)}
				use:clickShortcut={{ key: 'Escape' }}
			>
				<XIcon class="h-4 w-4" />
			</button>
		</div>
	{/if}
</div>
