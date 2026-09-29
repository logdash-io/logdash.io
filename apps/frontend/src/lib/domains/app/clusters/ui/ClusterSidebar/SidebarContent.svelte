<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';
  import SidebarProjects from './SidebarProjects.svelte';
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

  <div class="flex min-h-0 flex-1 flex-col gap-4 px-3 pt-1">
    <SidebarMenuItem
      href={resolve('/app/clusters')}
      isActive={page.url.pathname === '/app/clusters'}
    >
      <GridIcon class="size-4 shrink-0" />
      <span class="truncate">All projects</span>
    </SidebarMenuItem>

    <SidebarProjects />
  </div>

  <SidebarUserProfile />
</div>
