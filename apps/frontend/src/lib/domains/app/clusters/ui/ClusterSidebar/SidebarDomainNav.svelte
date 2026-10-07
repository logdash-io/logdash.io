<script lang="ts">
  import AnalyticsIcon from '$lib/domains/shared/icons/AnalyticsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    basePath?: string;
    active?: 'analytics' | 'uptime' | 'status-pages' | 'settings' | null;
    disabled?: boolean;
    published?: boolean;
    down?: number;
  };

  const {
    basePath,
    active = null,
    disabled = false,
    published = false,
    down = 0,
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
  href={basePath && `${basePath}/uptime`}
  isActive={active === 'uptime'}
  {disabled}
  nested
>
  <MonitoringIcon class="size-4 shrink-0" />
  <span class="truncate">Uptime</span>
  {#if down}
    <span class="text-error ml-auto shrink-0 text-[13px]">{down} down</span>
  {/if}
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
