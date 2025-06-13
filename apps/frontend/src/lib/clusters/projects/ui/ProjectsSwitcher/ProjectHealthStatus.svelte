<script lang="ts">
	import { page } from '$app/state';
	import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
	import { isDev } from '$lib/shared/utils/is-dev.util.js';
	import { monitoringState } from '../../application/monitoring.state.svelte.js';
	import MonitorStatus from '../presentational/MonitorStatus.svelte';

	const { projectId } = $props();
	const isOnDemoDashboard = $derived(
		page.url.pathname.includes('/demo-dashboard'),
	);
	const projectMonitor = $derived(
		monitoringState.getMonitorByProjectId(projectId),
	);
	const isHealthy = $derived(monitoringState.isHealthy(projectMonitor?.id));
</script>

{#snippet fullStatus()}
	<MonitorStatus {projectId} />
{/snippet}

{#if projectMonitor && !isOnDemoDashboard && isDev()}
	<Tooltip interactive={true} content={fullStatus} placement="bottom">
		<div
			class={[
				'badge badge-soft mr-2',
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
	</Tooltip>
{/if}
