<script lang="ts">
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
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
    <a href="/app/clusters" class="flex items-center gap-2 px-3 shrink-0">
      <Logo class="h-8 w-8" />
      <span class="text-xl font-bold">logdash</span>
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
