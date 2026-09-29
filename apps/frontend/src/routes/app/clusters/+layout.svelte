<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate, invalidateAll, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { isDev } from '$lib';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
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
  const initialMonitors = $derived(
    (page.data.initialMonitors as Monitor[] | undefined) ?? [],
  );

  function syncData(): void {
    userState.set(data.user);
    clustersState.set(data.clusters);
  }

  function syncMonitors(): void {
    monitoringState.set(initialMonitors);
  }

  syncData();
  syncMonitors();

  $effect(syncData);
  $effect(syncMonitors);

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
      void invalidateAll();
    }
  });

  let claimedCaptured = false;

  afterNavigate(() => {
    if (claimedCaptured || page.url.searchParams.get('claimed') !== '1') {
      return;
    }

    claimedCaptured = true;
    posthog.capture('account_claimed');

    const url = new URL(page.url);
    url.searchParams.delete('claimed');

    queueMicrotask(() => {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- shallow update of the already-resolved current url, not a navigation to a new route
      replaceState(url, page.state);
    });
  });
</script>

<UpgradeModal />

<ClusterShell>
  {@render children?.()}
</ClusterShell>
