<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { isDev } from '$lib';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
  import ClusterShell from '$lib/domains/app/clusters/ui/ClusterShell/ClusterShell.svelte';
  import UpgradeModal from '$lib/domains/shared/upgrade/UpgradeModal.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import type { User } from '$lib/domains/shared/user/domain/user';
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
  const isClustersRoot = $derived(page.url.pathname === '/app/clusters');

  $effect.pre(() => {
    userState.set(data.user);
    clustersState.set(data.clusters);
  });

  $effect(() => {
    if (browser && !isDev()) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        tier: data.user.tier,
      });
    }
  });

  $effect(() => {
    if (isClustersRoot) {
      invalidateAll();
    }
  });
</script>

<UpgradeModal />

<ClusterShell>
  {@render children?.()}
</ClusterShell>
