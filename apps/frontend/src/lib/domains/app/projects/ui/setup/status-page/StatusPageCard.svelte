<script lang="ts">
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { onMount } from 'svelte';

  type Props = {
    clusterId: string;
    dashboardId: string;
  };
  const { clusterId, dashboardId }: Props = $props();

  let hasInitialized = $state(false);

  const dashboard = $derived(
    publicDashboardManagerState.getDashboard(dashboardId),
  );
  const isPublished = $derived(dashboard?.isPublic ?? false);
  const dashboardName = $derived(dashboard?.name ?? 'Status Page');
  const dashboardUrl = $derived(
    publicDashboardManagerState.getDashboardUrl(dashboardId),
  );
  const settingsUrl = $derived(
    `/app/clusters/${clusterId}/status-pages/${dashboardId}`,
  );

  onMount(async () => {
    await publicDashboardManagerState.loadPublicDashboards(clusterId);
    hasInitialized = true;
  });

  function onCopyUrl(): void {
    navigator.clipboard.writeText(dashboardUrl);
    toast.success('Status page URL copied to clipboard');
  }

  function onOpenStatusPage(): void {
    window.open(dashboardUrl, '_blank');
  }
</script>

{#if !hasInitialized}
  <div class="flex w-full max-w-2xl items-center justify-center py-12">
    <span class="loading loading-spinner loading-md"></span>
  </div>
{:else}
  <div class="ld-card flex w-full max-w-2xl flex-col gap-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class={[
            'flex size-10 items-center justify-center rounded-lg',
            { 'bg-success/10': isPublished, 'bg-base-100': !isPublished },
          ]}
        >
          <PublicDashboardIcon
            class={['size-5', { 'text-success': isPublished }]}
          />
        </div>
        <div class="flex flex-col">
          <span class="font-semibold">{dashboardName}</span>
          <div class="flex items-center gap-2">
            {#if isPublished}
              <span class="badge badge-success badge-soft badge-xs">
                Published
              </span>
            {:else}
              <span class="badge badge-secondary badge-soft badge-xs">
                Draft
              </span>
            {/if}
          </div>
        </div>
      </div>

      <a href={settingsUrl} class="btn btn-secondary btn-sm gap-1">
        <SettingsIcon class="size-4" />
        Settings
      </a>
    </div>

    {#if isPublished}
      <div
        class="flex flex-wrap items-center gap-2 border-t border-base-100 pt-4"
      >
        <button onclick={onOpenStatusPage} class="btn btn-xs btn-primary gap-1">
          <OpenIcon class="size-4" />
          View live
        </button>
        <button onclick={onCopyUrl} class="btn btn-xs btn-ghost gap-1">
          <CopyIcon class="size-4" />
          Copy URL
        </button>
      </div>
    {:else}
      <div class="border-t border-base-100 pt-4">
        <p class="text-sm text-base-content/60">
          Configure and publish your status page to make it visible to everyone.
        </p>
      </div>
    {/if}
  </div>
{/if}
