<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { isDev } from '$lib';
	import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
	import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
	import ClusterShell from '$lib/clusters/clusters/ui/ClusterShell/ClusterShell.svelte';
	import { userState } from '$lib/shared/user/application/user.state.svelte.js';
	import type { User } from '$lib/shared/user/domain/user';
	import type { PostHog } from 'posthog-js';
	import { getContext, type Snippet } from 'svelte';

	type Props = {
		data: {
			clusters: Cluster[];
			user: User;
		};
		children: Snippet;
	};
	const { data, children }: Props = $props();
	const posthog = getContext<PostHog>('posthog');

	$effect(() => {
		userState.set(data.user);
		clustersState.set(data.clusters);

		if (browser && !isDev()) {
			posthog.identify(data.user.id, {
				email: data.user.email,
				tier: data.user.tier,
			});
		}
	});

	$effect(() => {
		if (page.url.pathname === '/app/clusters') {
			invalidate('/app/clusters');
		}
	});
</script>

<ClusterShell>
	{@render children?.()}
</ClusterShell>
