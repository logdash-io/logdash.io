<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { ChevronRightIcon } from 'lucide-svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  const clusterId = $derived(page.params.cluster_id);
  const currentPath = $derived(page.url.pathname);

  const isCockpitActive = $derived(
    currentPath === `/app/clusters/${clusterId}`,
  );
  const isSettingsActive = $derived(
    currentPath === `/app/clusters/${clusterId}/settings`,
  );

  const cluster = $derived(clustersState.get(clusterId));
  const clusterPublicDashboard = $derived(cluster?.publicDashboards?.[0]);
  const isPublic = $derived(clusterPublicDashboard?.isPublic);
  const dashboardUrl = $derived(
    publicDashboardManagerState.getDashboardUrl(clusterPublicDashboard?.id),
  );
</script>

{#snippet publicDashboardMenu(close: () => void)}
  {@const totalPublicDashboardCount = clustersState.publishedDashboardsCount}
  {@const canAddMore =
    totalPublicDashboardCount <
    exposedConfigState.maxNumberOfPublicDashboards(userState.tier)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    {#if isPublic}
      <li>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="flex w-full items-center gap-2 whitespace-nowrap"
        >
          <OpenIcon class="size-4" />
          Open
        </a>
      </li>

      <li>
        <button
          onclick={() => {
            navigator.clipboard.writeText(dashboardUrl);
            toast.success('Public Dashboard URL copied to clipboard');
            close();
          }}
          class="flex w-full items-center gap-2 whitespace-nowrap"
        >
          <CopyIcon class="size-4" />
          Copy public URL
        </button>
      </li>
    {/if}

    {#if !canAddMore && !isPublic}
      <UpgradeButton>Upgrade to add more public dashboards</UpgradeButton>
    {:else}
      <li>
        <button
          onclick={() => {
            goto(`/app/clusters/${cluster.id}/configure/public-dashboard`);
            close();
          }}
          class="flex w-full items-center gap-2 whitespace-nowrap"
        >
          <SettingsIcon class="size-4" />
          Settings
        </button>
      </li>
    {/if}
  </ul>
{/snippet}

<nav class="flex flex-col gap-0.5">
  <SidebarMenuItem
    href="/app/clusters/{clusterId}"
    isActive={isCockpitActive}
    disabled={!clusterId}
  >
    <HomeIcon class="size-4 shrink-0" />
    <span class="truncate">Home</span>
  </SidebarMenuItem>

  <SidebarMenuItem
    href="/app/clusters/{clusterId}/settings"
    isActive={isSettingsActive}
    disabled={!clusterId}
  >
    <SettingsIcon class="size-4 shrink-0" />
    <span class="truncate">Settings</span>
  </SidebarMenuItem>

  <Tooltip
    class="w-full"
    content={publicDashboardMenu}
    interactive={true}
    placement="right"
    align="top"
    trigger="click"
    closeOnOutsideTooltipClick={true}
  >
    <button
      disabled={!clusterId}
      class={[
        'group flex w-full text-sm items-center gap-2 rounded-lg p-2 px-2.5',
        {
          'hover:bg-base-100/80 cursor-pointer': clusterId,
          'opacity-50 cursor-not-allowed pointer-events-none': !clusterId,
        },
      ]}
    >
      <PublicDashboardIcon class="size-4 shrink-0" />
      <span class="truncate">Public Dashboard</span>
      <ChevronRightIcon
        class="size-4 shrink-0 ml-auto text-base-content/50 group-hover:translate-x-0.5 transition-transform group-hover:text-base-content"
      />
    </button>
  </Tooltip>
</nav>
