<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import { get_max_number_of_projects } from '$lib/shared/constants/plan-configs.js';
	import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
	import { userState } from '$lib/shared/user/application/user.state.svelte.js';
	import { projectsState } from '../../../../projects/application/projects.state.svelte.js';
	import ProjectCreator from './ProjectCreator.svelte';

	type Props = {
		withDefaultRedirect: boolean;
		creationDisabled?: boolean;
	};
	const { withDefaultRedirect, creationDisabled }: Props = $props();
	const project_badge_class =
		'badge badge-soft badge-md gap-1 cursor-pointer';

	$effect(() => {
		const project_id = page.url.searchParams.get('project_id');

		if (
			!project_id &&
			projectsState.projects.length &&
			withDefaultRedirect
		) {
			const defaultProject = projectsState.projects[0];
			if (defaultProject) {
				goto(`?project_id=${defaultProject.id}`, {
					replaceState: true,
				});
			}
		}
	});
</script>

<div role="tablist" class="tabs z-20 gap-1.5 sm:gap-3">
	{#each projectsState.projects as project}
		{@const activeProject =
			project.id === page.url.searchParams.get('project_id')}
		<a
			href={`?project_id=${project.id}`}
			role="tab"
			class={[
				project_badge_class,
				{
					'badge-primary': activeProject,
					'badge-secondary': !activeProject,
				},
			]}
		>
			{project.name}
		</a>
	{/each}

	{#if !creationDisabled}
		<ProjectCreator
			canAddMore={clustersState.allClustersProjectsCount <
				get_max_number_of_projects(userState.tier)}
			onSubmit={(name) => {
				projectsState
					.createProject(page.params.cluster_id, name)
					.then((projectId) => {
						goto(
							`/app/clusters/${page.params.cluster_id}/?project_id=${projectId}`,
							{ replaceState: true },
						);
						toast.success(
							`Project ${name} created successfully, you can now configure it.`,
							5000,
						);
					});
			}}
			delayIn={0}
			delayOut={0}
		/>
	{/if}
</div>
