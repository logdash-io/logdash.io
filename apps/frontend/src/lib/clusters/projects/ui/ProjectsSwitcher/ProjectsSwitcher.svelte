<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import { get_max_number_of_projects } from '$lib/shared/constants/plan-configs.js';
	import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
	import { userState } from '$lib/shared/user/application/user.state.svelte.js';
	import {
		CopyIcon,
		MoreVerticalIcon,
		PenLineIcon,
		Trash2Icon,
	} from 'lucide-svelte';
	import { projectsState } from '../../application/projects.state.svelte.js';
	import ProjectCreator from './ProjectCreator.svelte';
	import ProjectHealthStatus from './ProjectHealthStatus.svelte';

	type Props = {
		withDefaultRedirect: boolean;
		creationDisabled?: boolean;
	};
	const { withDefaultRedirect, creationDisabled }: Props = $props();
	const project_badge_class =
		'ld-card-base rounded-full py-2 px-2.5 flex cursor-pointer items-center';

	const isOnDemoDashboard = $derived(
		page.url.pathname.includes('/demo-dashboard'),
	);

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

<div role="tablist" class="tabs z-30 gap-1.5 sm:gap-3">
	{#each projectsState.projects as project}
		{@const activeProject =
			project.id === page.url.searchParams.get('project_id')}

		<div
			class={[
				project_badge_class,
				{
					'ring-primary/30 ring': activeProject,
					'pr-2': activeProject && !isOnDemoDashboard,
					// 'px-4': !activeProject,
				},
			]}
			role="tab"
		>
			<ProjectHealthStatus projectId={project.id} />

			<a href={`?project_id=${project.id}`} class="mx-2 select-none">
				{project.name}
			</a>

			{#if activeProject && !isOnDemoDashboard}
				<div class="dropdown z-30 flex">
					<div
						tabindex="0"
						role="button"
						class="btn btn-circle btn-transparent mr-0.5 aspect-square h-full w-fit shrink-0"
					>
						<MoreVerticalIcon class="h-4 w-4 shrink-0" />
					</div>

					<ul
						tabindex="0"
						class="menu dropdown-content text-secondary bg-base-100 rounded-box z-1 mt-1 w-fit whitespace-nowrap p-2 shadow"
					>
						<li>
							<a
								onclick={() => {
									projectsState
										.getApiKey(project.id)
										.then((key) => {
											navigator.clipboard.writeText(key);
											toast.success(
												'Project API key copied to clipboard',
												5000,
											);
										});
								}}
								class="whitespace-nowrap"
							>
								Copy project api key

								{#if projectsState.isLoadingApiKey(project.id)}
									<span
										class="loading loading-spinner loading-xs ml-1"
									></span>
								{:else}
									<CopyIcon class="ml-1.5 h-3.5 w-3.5" />
								{/if}
							</a>
						</li>

						<li>
							<a
								onclick={() => {
									const newName = prompt(
										'Enter new project name',
										project.name,
									);

									if (!newName || newName.trim() === '') {
										toast.error(
											'Project name cannot be empty',
											5000,
										);
										return;
									}

									if (newName === project.name) {
										toast.info(
											'Project name is the same, no changes made',
											5000,
										);
										return;
									}

									projectsState
										.updateProject(project.id, newName)
										.then((key) => {
											toast.success(
												'Project updated successfully',
												5000,
											);
										});
								}}
								class="whitespace-nowrap"
							>
								Rename project

								{#if projectsState.isUpdatingProject(project.id)}
									<span
										class="loading loading-spinner loading-xs ml-auto"
									></span>
								{:else}
									<PenLineIcon class="ml-auto h-4 w-4" />
								{/if}
							</a>
						</li>

						<li>
							<a
								onclick={() => {
									if (
										!confirm(
											'Are you sure you want to delete this project?',
										) ||
										projectsState.isDeletingProject(
											project.id,
										)
									) {
										return;
									}

									projectsState
										.deleteProject(project.id)
										.then((key) => {
											goto(
												`/app/clusters/${page.params.cluster_id}`,
											);
											toast.success(
												'Project deleted successfully',
												5000,
											);
										});
								}}
								class="text-error whitespace-nowrap"
							>
								Delete project

								{#if projectsState.isDeletingProject(project.id)}
									<span
										class="loading loading-spinner loading-xs ml-auto"
									></span>
								{:else}
									<Trash2Icon class="ml-auto h-4 w-4" />
								{/if}
							</a>
						</li>
					</ul>
				</div>
			{/if}
		</div>
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
							`Service ${name} created successfully, you can now configure it.`,
							5000,
						);
					});
			}}
		/>
	{/if}
</div>
