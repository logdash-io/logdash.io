<script lang="ts">
  import AnalyticsIcon from '$lib/domains/shared/icons/AnalyticsIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    basePath?: string;
    active?: 'analytics' | 'status-pages' | 'settings' | null;
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
  isActive={active === 'analytics'}
  {disabled}
  nested
>
  <AnalyticsIcon class="size-4 shrink-0" />
  <span class="truncate">Analytics</span>
</SidebarMenuItem>

<SidebarMenuItem
  href={basePath && `${basePath}/status-pages`}
  isActive={active === 'status-pages'}
  {disabled}
  nested
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
  nested
>
  <SettingsIcon class="size-4 shrink-0" />
  <span class="truncate">Settings</span>
</SidebarMenuItem>

<div class="h-2 shrink-0"></div>
