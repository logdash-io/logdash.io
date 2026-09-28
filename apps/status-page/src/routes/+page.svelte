<script lang="ts">
	import { envConfig } from '@logdash/hyper-ui';
	import { PublicDashboard } from '@logdash/hyper-ui/features';
	import { statusPage } from '@logdash/status/svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const status = $derived(
		statusPage(data.statusPageId, { baseUrl: envConfig.apiBaseUrl, initialData: data.page })
	);
	const page = $derived(status.data ?? data.page);
	const description = $derived(`Current status and 90-day uptime of ${page.name}`);
</script>

<svelte:head>
	<title>{page.name}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={page.name} />
	<meta property="og:description" content={description} />
</svelte:head>

<PublicDashboard
	class="min-h-dvh"
	{page}
	lastUpdated={status.lastUpdated}
	isRefreshing={status.isLoading}
/>
