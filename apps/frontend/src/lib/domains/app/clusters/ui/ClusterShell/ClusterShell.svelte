<script lang="ts">
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import ClusterSidebar from '$lib/domains/app/clusters/ui/ClusterSidebar/ClusterSidebar.svelte';
  import PendingInvitations from '$lib/domains/app/clusters/ui/PendingInvitations.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  type Props = {
    children: Snippet;
  };
  const { children }: Props = $props();

  onMount(() => {
    const cleanup = userInvitationsState.startPollingInvitations();
    return () => cleanup();
  });
</script>

<div class="w-full h-dvh flex">
  <ClusterSidebar />

  <ScrollArea class="relative mx-auto flex h-full w-full flex-col">
    <ResponsiveSkyBackground />
    <div class="mx-auto flex h-full max-h-full w-full max-w-4xl">
      <div
        class="relative flex h-full w-full flex-col items-center p-1 md:p-2 md:px-4"
      >
        <PendingInvitations />
        {@render children()}
      </div>
    </div>
  </ScrollArea>
</div>
