<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
	import ProjectView from '$lib/clusters/projects/ui/ProjectView/ProjectView.svelte';
	import { Feature } from '$lib/shared/types';
	import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
	import { isDev } from '$lib/shared/utils/is-dev.util';
	import { ArrowRightIcon } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { clustersState } from '../../application/clusters.state.svelte.js';
	import ProjectsSwitcher from './ProjectsSwitcher/ProjectsSwitcher.svelte';
	import SetupMonitoringButton from './SetupMonitoringButton.svelte';

	type Props = {
		priorityClusterId?: string;
	};

	const isOnDemoDashboard = $derived(
		page.url.pathname.includes('/demo-dashboard'),
	);

	const { priorityClusterId }: Props = $props();

	const clusterId = priorityClusterId ?? page.params.cluster_id;

	const hasLogging = $derived.by(() => {
		const id = page.url.searchParams.get('project_id');

		return projectsState.hasFeature(id, Feature.LOGGING);
	});

	const hasMetrics = $derived.by(() => {
		const id = page.url.searchParams.get('project_id');

		return projectsState.hasFeature(id, Feature.METRICS);
	});

	const hasMonitoring = $derived.by(() => {
		const id = page.url.searchParams.get('project_id');

		return clustersState.hasFeature(id, Feature.MONITORING);
	});
</script>

<div class="mb-8 h-full w-full space-y-4">
	<div
		class="z-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
	>
		<ProjectsSwitcher
			creationDisabled={isOnDemoDashboard}
			withDefaultRedirect
		/>

		{#if hasLogging || hasMetrics || hasMonitoring}
			<div
				class="z-20 mr-auto flex items-center gap-2 sm:ml-auto sm:mr-0"
			>
				{#if !hasLogging && projectsState.ready}
					<button
						in:fly={{ y: -2, duration: 100 }}
						onclick={() => {
							goto(
								`/app/clusters/${clusterId}/configure/logging?project_id=${page.url.searchParams.get('project_id')}`,
							);
						}}
						class="btn btn-secondary btn-xs gap-1 opacity-90"
					>
						Setup logging <ArrowRightIcon class="h-4 w-4" />
					</button>
				{/if}

				{#if !hasMetrics && projectsState.ready}
					<button
						in:fly={{ y: -2, duration: 100 }}
						onclick={() => {
							goto(
								`/app/clusters/${clusterId}/configure/metrics?project_id=${page.url.searchParams.get('project_id')}`,
							);
						}}
						class="btn btn-secondary btn-xs gap-1 opacity-90"
					>
						Setup metrics <ArrowRightIcon class="h-4 w-4" />
					</button>
				{/if}

				{#if isDev() && !hasMonitoring && clustersState.ready}
					<SetupMonitoringButton
						canAddMore={true}
						onSubmit={(url) => {
							goto(
								`/app/clusters/${clusterId}/configure/monitoring?project_id=${page.url.searchParams.get(
									'project_id',
								)}&url=${encodeURIComponent(url)}`,
							);
						}}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<ProjectView />
</div>
