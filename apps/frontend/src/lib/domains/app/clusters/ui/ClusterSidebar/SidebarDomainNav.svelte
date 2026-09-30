<script lang="ts">
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    basePath?: string;
    active?: 'home' | 'status-pages' | 'settings' | null;
    disabled?: boolean;
    published?: boolean;
  };

  const {
    basePath,
    active = null,
    disabled = false,
    published = false,
  }: Props = $props();
</script>

<SidebarMenuItem
  href={basePath}
  isActive={active === 'home'}
  {disabled}
  class="pl-5"
>
  <HomeIcon class="size-4 shrink-0" />
  <span class="truncate">Home</span>
</SidebarMenuItem>

<SidebarMenuItem
  href={basePath && `${basePath}/status-pages`}
  isActive={active === 'status-pages'}
  {disabled}
  class="pl-5"
>
  <PublicDashboardIcon
    class={['size-4 shrink-0', { 'text-success!': published }]}
  />
  <span class="truncate">Status pages</span>
</SidebarMenuItem>

<SidebarMenuItem
  href={basePath && `${basePath}/settings`}
  isActive={active === 'settings'}
  {disabled}
  class="pl-5"
>
  <SettingsIcon class="size-4 shrink-0" />
  <span class="truncate">Settings</span>
</SidebarMenuItem>

<div class="border-hairline my-1 ml-5 shrink-0 border-t"></div>
