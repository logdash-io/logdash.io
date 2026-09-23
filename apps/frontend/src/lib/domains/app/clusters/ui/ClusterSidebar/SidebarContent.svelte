<script lang="ts">
  import { resolve } from '$app/paths';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import SidebarClusterNav from './SidebarClusterNav.svelte';
  import SidebarClusterSelector from './SidebarClusterSelector.svelte';
  import SidebarServicesList from './SidebarServicesList.svelte';
  import SidebarUserProfile from './SidebarUserProfile.svelte';

  type Props = {
    showLogo?: boolean;
  };
  const { showLogo = true }: Props = $props();
</script>

<div class="flex flex-1 flex-col">
  {#if showLogo}
    <a href={resolve('/app/clusters')} class="flex px-3 shrink-0">
      <Logotype class="text-[20px]" />
    </a>
  {/if}

  <div class="flex flex-col gap-1 flex-1 p-2">
    <SidebarClusterSelector />

    <div class="">
      <SidebarClusterNav />

      <SidebarServicesList />
    </div>
  </div>

  <SidebarUserProfile />
</div>
