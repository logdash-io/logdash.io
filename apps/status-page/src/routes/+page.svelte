<script lang="ts">
	import type { PageData } from './$types';
	import { PublicDashboard } from '@logdash/hyper-ui';
	import { PublicDashboardPublicState } from '@logdash/hyper-ui/features/public-dashboard/states/public-dashboard-public.state.svelte';
	import '@logdash/hyper-ui/styles';
	import '@fontsource-variable/geist-mono';
	import '@fontsource-variable/kumbh-sans';

	const { data }: { data: PageData } = $props();

	const dashboardState = $derived.by(() => {
		const state = new PublicDashboardPublicState();
		state.setDashboardData(data.dashboardData);
		return state;
	});
</script>

<PublicDashboard
	enablePolling={true}
	onRefresh={() => dashboardState.loadDashboard(data.dashboardId)}
	pollingInterval={60}
	state={dashboardState}
/>
