<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { PublicDashboard } from '@logdash/hyper-ui';
	import { publicDashboardPublicState } from '@logdash/hyper-ui/features/public-dashboard/states/public-dashboard-public.state.svelte';
	import '@logdash/hyper-ui/styles';
	import '@fontsource-variable/geist-mono';
	import '@fontsource-variable/kumbh-sans';

	const { data }: { data: PageData } = $props();

	onMount(async () => {
		if (data.dashboardData) {
			publicDashboardPublicState.setDashboardData(data.dashboardData);
		} else {
			await publicDashboardPublicState.loadDashboard(data.dashboardId);
		}
	});
</script>

<PublicDashboard
	enablePolling={true}
	onRefresh={() => publicDashboardPublicState.loadDashboard(data.dashboardId)}
	pollingInterval={60}
	state={publicDashboardPublicState}
/>
