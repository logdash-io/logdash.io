<script lang="ts">
	import { goto } from '$app/navigation';
	import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
	import { clickShortcut } from '$lib/shared/ui/actions/click-shortcut.svelte.js';
	import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
	import { CheckIcon, PlusIcon, XIcon } from 'lucide-svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	type Props = {
		canAddMore: boolean;
		delayIn?: number;
		delayOut?: number;
		onSubmit: (name: string) => void;
	};
	const { canAddMore, delayIn, delayOut, onSubmit }: Props = $props();

	const MIN_NAME_LENGTH = 3;
	const MAX_NAME_LENGTH = 30;

	let creatingProject = $state(false);
	let projectName = $state('');
	// svelte-ignore non_reactive_update
	let inputRef;

	$effect(() => {
		if (creatingProject) {
			projectName = '';
			inputRef?.focus();
		}
	});
</script>

<div class="relative z-10 flex">
	<button
		onclick={() => {
			creatingProject = true;
		}}
		class={'badge badge-soft badge-md cursor-pointer gap-1'}
		tabindex="0"
	>
		add project <PlusIcon class="h-3.5 w-3.5" />
	</button>

	{#if creatingProject}
		<div
			in:fly={{ y: 5, duration: 200, easing: cubicOut }}
			out:fly={{ y: 5, duration: 200, easing: cubicOut }}
			class={[
				'ld-card-base ring-base-100 absolute top-full mt-2 flex h-20 w-96 items-center justify-between gap-2 rounded-xl pr-6 shadow-xl ring transition-colors',
				{
					'focus-within:ring-success/50':
						projectName.length >= MIN_NAME_LENGTH &&
						projectName.length < MAX_NAME_LENGTH,
					'focus-within:ring-primary/50':
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
						creatingProject = false;
					}}
					use:clickShortcut={{ key: 'Enter' }}
				>
					<CheckIcon class="h-4 w-4" />
				</button>

				<button
					class="btn btn-error btn-soft btn-sm btn-square"
					onclick={() => (creatingProject = false)}
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
							goto('/api/user/upgrade');
						}}
					>
						Upgrade
					</button>
					<button
						class="btn btn-error btn-soft btn-sm btn-square"
						onclick={() => (creatingProject = false)}
					>
						<XIcon class="h-4 w-4" />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
