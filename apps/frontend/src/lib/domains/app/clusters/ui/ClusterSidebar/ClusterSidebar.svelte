<script lang="ts">
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import SidebarClusterNav from './SidebarClusterNav.svelte';
  import SidebarClusterSelector from './SidebarClusterSelector.svelte';
  import SidebarServicesList from './SidebarServicesList.svelte';
  import SidebarUserProfile from './SidebarUserProfile.svelte';
</script>

<aside class="hidden h-full w-xs flex-shrink-0 flex-col lg:flex p-2 pr-0">
  <div
    class="ld-card-base h-full ld-card-rounding gap-2 p-1 pt-3 flex flex-col"
  >
    <a href="/app/clusters" class="flex items-center gap-2 px-3 shrink-0">
      <Logo class="h-8 w-8" />
      <span class="text-xl font-bold">logdash</span>
    </a>

    <div class="flex flex-col gap-1 flex-1 p-2">
      <SidebarClusterSelector />

      <div class="">
        <SidebarClusterNav />

        <SidebarServicesList />
      </div>
    </div>

    <SidebarUserProfile />
  </div>
</aside>
