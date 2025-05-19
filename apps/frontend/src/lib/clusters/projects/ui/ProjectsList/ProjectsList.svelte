<script lang="ts">
	import { goto } from '$app/navigation';
	import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import ProjectCreatorTile from './ProjectCreatorTile.svelte';
	import { get_max_number_of_projects } from '$lib/shared/constants/plan-configs';

	const { canCreate } = $props();

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	const projectsPerColumn = $derived.by(() => {
		const columns = 2;
		const projectsPerColumn = [[], []];

		projectsState.projects.forEach((project, i) => {
			const column = i % columns;
			projectsPerColumn[column].push(project);
		});

		return projectsPerColumn;
	});
</script>

{#if mounted}
	<div class="absolute mx-auto flex w-full max-w-4xl gap-4">
		{#each [0, 1] as column}
			<div class="flex w-full flex-col gap-4">
				{#each projectsPerColumn[column] as project, i}
					<a
						draggable="false"
						role="button"
						href="/app/projects/{project.id}"
						in:fly|global={{
							y: -5,
							duration: 400,
							delay: 60 * (projectsState.projects.length - i + 1),
						}}
						class="ld-card flex h-fit w-full items-center justify-between gap-2"
					>
						<h5 class="text-lg font-semibold">
							{project.name}
						</h5>

						<div class="badge badge-soft badge-success">
							<span class="status status-success"></span>
							active
						</div>
					</a>
				{/each}

				{#if (column === 0 && projectsState.projects.length % 2 === 0) || (column === 1 && projectsState.projects.length % 2 === 1)}
					{@const delay = 100 * (projectsState.projects.length + 1)}
					<ProjectCreatorTile
						canAddMore={canCreate}
						delayIn={column === 0 ? 0 : delay}
						delayOut={0}
						onSubmit={(name) => {
							projectsState
								.createProject(name)
								.then((createdProjectId) => {
									goto(
										`/app/projects/${createdProjectId}/configure`,
									);
								});
						}}
					/>
				{/if}
			</div>
		{/each}
	</div>
{/if}
