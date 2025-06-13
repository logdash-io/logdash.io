<script lang="ts">
	import { goto } from '$app/navigation';
	import { clickShortcut } from '$lib/shared/ui/actions/click-shortcut.svelte';
	import { CheckIcon, Plus, XIcon } from 'lucide-svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Props = {
		canAddMore: boolean;
		delayIn?: number;
		delayOut?: number;
		onSubmit: (name: string) => void;
	};
	const { canAddMore, delayIn, delayOut, onSubmit }: Props = $props();

	const MIN_NAME_LENGTH = 3;
	const MAX_NAME_LENGTH = 30;

	let editMode = $state(false);
	let projectName = $state('');
	// svelte-ignore non_reactive_update
	let inputRef;

	$effect(() => {
		if (editMode) {
			projectName = '';
			inputRef?.focus();
		}
	});
</script>

<div
	in:fly|global={{
		y: -5,
		duration: 400,
		delay: delayIn,
	}}
	style="min-height: calc(var(--spacing) * 24)"
	class="ld-card-base relative flex h-full max-h-32 w-full items-center justify-between gap-2 overflow-hidden rounded-xl"
>
	{#if editMode}
		<div
			in:fly={{ y: 5, duration: 400, easing: cubicOut }}
			class={[
				'absolute top-1/2 flex h-full w-full -translate-y-1/2 items-center justify-between gap-2 rounded-xl border border-transparent pr-6 transition-colors',
				{
					'focus-within:border-success/50':
						projectName.length >= MIN_NAME_LENGTH &&
						projectName.length < MAX_NAME_LENGTH,
					'focus-within:border-primary/50':
						projectName.length < MIN_NAME_LENGTH,
				},
			]}
		>
			{#if canAddMore}
				<input
					bind:this={inputRef}
					bind:value={projectName}
					minlength={MIN_NAME_LENGTH}
					maxlength={MAX_NAME_LENGTH}
					class="input-sm input-ghost selection:bg-secondary/20 h-full w-full rounded-lg pl-6 text-lg font-semibold outline-0 focus:bg-transparent"
					placeholder="New project name"
				/>

				{#if projectName.length > MIN_NAME_LENGTH && projectName.length < MAX_NAME_LENGTH}{:else}{/if}

				<button
					disabled={projectName.length < MIN_NAME_LENGTH ||
						projectName.length > MAX_NAME_LENGTH}
					class="btn btn-success btn-soft btn-sm btn-square"
					onclick={() => {
						onSubmit(projectName);
						editMode = false;
					}}
					use:clickShortcut={{ key: 'Enter' }}
				>
					<CheckIcon class="h-4 w-4" />
				</button>

				<button
					class="btn btn-error btn-soft btn-sm btn-square"
					onclick={() => (editMode = false)}
					use:clickShortcut={{ key: 'Escape' }}
				>
					<XIcon class="h-4 w-4" />
				</button>
			{:else}
				<div
					class="flex w-full items-center justify-between gap-2 pl-8"
				>
					<h5 class="text- font-semibold">
						Upgrade to add more projects
					</h5>
					<button
						class="btn btn-primary btn-sm ml-auto"
						onclick={() => {
							goto('/app/api/user/upgrade');
						}}
					>
						Upgrade
					</button>
					<button
						class="btn btn-error btn-soft btn-sm btn-square"
						onclick={() => (editMode = false)}
					>
						<XIcon class="h-4 w-4" />
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<button
			in:fly={{ y: -5, duration: 400, easing: cubicOut }}
			class="absolute flex h-full w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-8"
			role="button"
			onclick={(e) => {
				if (editMode) {
					e.preventDefault();
					return;
				}
				editMode = !editMode;
			}}
			data-posthog-id="create-cluster-button"
		>
			<h5 class="text-lg font-semibold">Create new project</h5>

			<div class="badge badge-lg badge-soft badge-primary rounded-full">
				<Plus class="h-4 w-4" />
			</div>
		</button>
	{/if}
</div>
