<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import { get_max_number_of_projects } from '$lib/shared/constants/plan-configs.js';
	import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
	import { userState } from '$lib/shared/user/application/user.state.svelte.js';
	import { CopyIcon, MoreVerticalIcon } from 'lucide-svelte';
	import { projectsState } from '../../application/projects.state.svelte.js';
	import ProjectCreator from './ProjectCreator.svelte';
	import ProjectHealthStatus from './ProjectHealthStatus.svelte';

	type Props = {
		withDefaultRedirect: boolean;
		creationDisabled?: boolean;
	};
	const { withDefaultRedirect, creationDisabled }: Props = $props();
	const project_badge_class =
		'ld-card-base rounded-xl px-4 py-3 flex gap-1 cursor-pointer items-center';

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
					// 'badge-secondary': !activeProject,
				},
			]}
			role="tab"
		>
			<ProjectHealthStatus projectId={project.id} />

			<a href={`?project_id=${project.id}`} class="select-none">
				{project.name}
			</a>

			{#if activeProject && !isOnDemoDashboard}
				<div class="dropdown z-30">
					<div
						tabindex="0"
						role="button"
						class="btn btn-circle btn-transparent aspect-square h-full w-fit shrink-0 p-1"
					>
						<MoreVerticalIcon class="h-4.5 w-4.5 shrink-0" />
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
									<CopyIcon class="ml-1.5 h-4 w-4" />
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
