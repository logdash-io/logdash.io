<script lang="ts">
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import SidebarClusterSelector from './SidebarClusterSelector.svelte';
  import SidebarServicesList from './SidebarServicesList.svelte';
  import SidebarUserProfile from './SidebarUserProfile.svelte';
</script>

<aside class="hidden h-full w-xs flex-shrink-0 flex-col lg:flex gap-4 p-4">
  <a href="/app/clusters" class="flex items-center gap-2 px-2 shrink-0">
    <Logo class="h-8 w-8" />
    <span class="text-xl font-bold">logdash</span>
  </a>

  <div
    class="flex flex-col gap-4 border border-base-100 flex-1 rounded-3xl p-4 bg-base-300"
  >
    <SidebarClusterSelector />
    <SidebarServicesList />
  </div>

  <SidebarUserProfile />
</aside>
