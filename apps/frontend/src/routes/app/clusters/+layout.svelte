<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate, invalidateAll, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { isDev } from '$lib';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
  import ClaimBanner from '$lib/domains/app/clusters/ui/ClaimBanner/ClaimBanner.svelte';
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

  function syncData(): void {
    userState.set(data.user);
    clustersState.set(data.clusters);
  }

  syncData();

  $effect(syncData);

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

{#if userState.isAnonymous}
  <ClaimBanner />
{/if}

<ClusterShell>
  {@render children?.()}
</ClusterShell>
