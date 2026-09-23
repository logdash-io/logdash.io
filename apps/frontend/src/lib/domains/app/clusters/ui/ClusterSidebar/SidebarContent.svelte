<script lang="ts">
  import { resolve } from '$app/paths';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import FeedbackButton from '$lib/domains/shared/ui/components/FeedbackButton.svelte';
  import SidebarClusterNav from './SidebarClusterNav.svelte';
  import SidebarClusterSelector from './SidebarClusterSelector.svelte';
  import SidebarServicesList from './SidebarServicesList.svelte';
  import SidebarUserProfile from './SidebarUserProfile.svelte';

  type Props = {
    showLogo?: boolean;
  };
  const { showLogo = true }: Props = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col">
  {#if showLogo}
    <a
      href={resolve('/app/clusters')}
      class="flex h-14 shrink-0 items-center px-5"
    >
      <Logotype class="text-[17px]" />
    </a>
  {/if}

  <div class="flex flex-1 flex-col gap-4 px-3 pt-1">
    <SidebarClusterSelector />

    <SidebarClusterNav />

    <SidebarServicesList />
  </div>

  <div class="flex flex-col gap-1 px-3 pt-4 pb-3">
    <FeedbackButton />

    <SidebarUserProfile />
  </div>
</div>
