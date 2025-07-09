<script lang="ts">
  import { goto } from '$app/navigation';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import {
    CopyIcon,
    ExternalLinkIcon,
    GanttChartSquareIcon,
    SettingsIcon,
  } from 'lucide-svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  type Props = {
    clusterId: string;
  };
  const { clusterId }: Props = $props();
  const cluster = $derived(clustersState.get(clusterId));
  const clusterPublicDashboard = $derived(cluster?.publicDashboards?.[0]);
  const isPublic = $derived(clusterPublicDashboard?.isPublic);
  const dashboardUrl = $derived(
    publicDashboardManagerState.getDashboardUrl(clusterPublicDashboard?.id),
  );
</script>

{#snippet menu(close: () => void)}
  {@const totalPublicDashboardCount = clustersState.publishedDashboardsCount}
  {@const canAddMore =
    totalPublicDashboardCount <
    exposedConfigState.maxNumberOfPublicDashboards(userState.tier)}
  <ul
    class="menu dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit p-2 whitespace-nowrap shadow"
  >
    {#if isPublic}
      <li>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="flex w-full justify-between whitespace-nowrap"
        >
          Open

          <ExternalLinkIcon class="ml-1.5 h-3.5 w-3.5" />
        </a>
      </li>

      <li>
        <a
          onclick={() => {
            navigator.clipboard.writeText(dashboardUrl);
            toast.success('Public Dashboard URL copied to clipboard');
            close();
          }}
          class="flex w-full justify-between whitespace-nowrap"
        >
          Copy public URL

          <CopyIcon class="ml-1.5 h-3.5 w-3.5" />
        </a>
      </li>
    {/if}

    {#if !canAddMore && !isPublic}
      <UpgradeButton>Upgrade to add more public dashboards</UpgradeButton>
    {:else}
      <li>
        <a
          onclick={() => {
            goto(`/app/clusters/${cluster.id}/configure/public-dashboard`);
            close();
          }}
          class="flex w-full justify-between whitespace-nowrap"
        >
          Settings

          <SettingsIcon class="ml-1.5 h-3.5 w-3.5" />
        </a>
      </li>
    {/if}
  </ul>
{/snippet}

<Tooltip
  class="w-full"
  content={menu}
  interactive={true}
  placement="bottom"
  trigger="click"
>
  <button
    class={[
      'btn flex w-full items-center justify-between gap-1 rounded-full',
      {
        'ld-card-base': !isPublic,
        'success-card': isPublic,
      },
    ]}
    data-posthog-id="cluster-settings-button"
    onclick={(e) => {
      e.stopPropagation();
    }}
  >
    Public Dashboard
    <GanttChartSquareIcon class="h-5 w-5" />
  </button>
</Tooltip>
