<script lang="ts">
	import { page } from '$app/state';
	import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
	import { DateTime } from 'luxon';
	import { monitoringState } from '../../application/monitoring.state.svelte.js';
	import DataTile from '../ProjectView/tiles/DataTile.svelte';
	import { logger } from '$lib/shared/logger/index.js';

	const { projectId } = $props();
	const MAX_PINGS = 60;

	const projectMonitor = $derived(
		monitoringState.getMonitorByProjectId(projectId),
	);
	const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
	const pings = $derived(
		monitoringState.monitoringPings(projectMonitor.id).slice(0, MAX_PINGS),
	);

	$effect(() => {
		logger.debug(
			`Syncing pings for project monitor: ${projectMonitor?.id}`,
		);

		if (!projectMonitor || !projectId) {
			logger.warn('No project monitor found for syncing pings.');
			return;
		}

		monitoringState.syncMonitorPings(
			page.params.cluster_id,
			projectId,
			projectMonitor?.id,
		);
	});
</script>

<DataTile>
	<div class="flex w-full flex-col gap-2">
		<div class="flex w-full gap-2">
			<div class="flex w-full items-center gap-2">
				<h5 class="text-2xl font-semibold">
					{projectMonitor?.name}
				</h5>

				<div
					class={[
						'badge badge-soft',
						{
							'badge-success': isHealthy,
							'badge-error': !isHealthy,
						},
					]}
				>
					<span
						class={[
							'status',
							{
								'status-success': isHealthy,
								'status-error': !isHealthy,
							},
						]}
					></span>
					{isHealthy ? 'up' : 'down'}
				</div>
			</div>

			<span class="loading loading-ring loading-sm duration-1000"></span>
		</div>

		<div class="flex w-full flex-col gap-1">
			<div
				class="flex h-12 w-full items-center justify-end gap-1 overflow-hidden lg:gap-1"
			>
				{#each Array.from({ length: 60 - pings.length }) as _, i (i)}
					<div
						class={[
							'h-8 w-1.5 shrink-0 rounded-sm hover:h-12 lg:w-[7px]',
							{
								'bg-gradient-to-b from-neutral-700 via-neutral-700/80 to-neutral-700': true,
								'bg-warning': false,
							},
						]}
					></div>
				{/each}

				{#each pings as ping (ping.id)}
					{@const pingHealthy =
						ping.statusCode >= 200 && ping.statusCode < 400}
					<Tooltip
						content={`${
							DateTime.fromJSDate(new Date(ping.createdAt))
								.toLocal()
								.toISO({ includeOffset: true })
								.split('T')
								.join(' ')
								.split('.')[0]
						}`}
						placement="top"
					>
						<div
							class={[
								'h-8 w-1.5 shrink-0 rounded-sm bg-gradient-to-b hover:h-12 lg:w-[7px]',
								{
									'from-green-600 via-green-600/80 to-green-600':
										pingHealthy,
									'from-orange-600 via-orange-600/80 to-orange-600':
										!pingHealthy,
								},
							]}
						></div>
					</Tooltip>
				{/each}
			</div>
		</div>

		<p class="text-secondary/60 text-sm">Last 60 pings</p>
	</div>
</DataTile>
