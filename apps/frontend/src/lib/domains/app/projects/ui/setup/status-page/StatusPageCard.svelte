<script lang="ts">
  import { resolve } from '$app/paths';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { onMount } from 'svelte';
  import { Badge, Button, Spinner } from '@logdash/hyper-ui/presentational';

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

  onMount(async () => {
    await publicDashboardManagerState.loadPublicDashboards(clusterId);
    hasInitialized = true;
  });

  async function onCopyUrl(): Promise<void> {
    await navigator.clipboard.writeText(dashboardUrl);
    toast.success('Status page URL copied to clipboard');
  }

  function onOpenStatusPage(): void {
    window.open(dashboardUrl, '_blank');
  }
</script>

{#if !hasInitialized}
  <div class="flex w-full max-w-2xl items-center justify-center py-12">
    <Spinner />
  </div>
{:else}
  <div class="ld-card flex w-full max-w-2xl flex-col gap-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class={[
            'flex size-10 items-center justify-center rounded-lg',
            { 'bg-success/10': isPublished, 'bg-surface-100': !isPublished },
          ]}
        >
          <PublicDashboardIcon
            class={['size-5', { 'text-success': isPublished }]}
          />
        </div>
        <div class="flex flex-col">
          <span class="font-medium">{dashboardName}</span>
          <div class="flex items-center gap-2">
            {#if isPublished}
              <Badge variant="success" size="xs">Published</Badge>
            {:else}
              <Badge size="xs">Draft</Badge>
            {/if}
          </div>
        </div>
      </div>

      <Button
        href={resolve(
          '/app/clusters/[cluster_id]/status-pages/[status_page_id]',
          {
            cluster_id: clusterId,
            status_page_id: dashboardId,
          },
        )}
        variant="primary"
        size="sm"
        class="gap-1"
      >
        <SettingsIcon class="size-4" />
        Settings
      </Button>
    </div>

    {#if isPublished}
      <div
        class="flex flex-wrap items-center gap-2 border-t border-border-default pt-4"
      >
        <Button
          variant="primary"
          size="xs"
          class="gap-1"
          onclick={onOpenStatusPage}
        >
          <OpenIcon class="size-4" />
          View live
        </Button>
        <Button variant="ghost" size="xs" class="gap-1" onclick={onCopyUrl}>
          <CopyIcon class="size-4" />
          Copy URL
        </Button>
      </div>
    {:else}
      <div class="border-t border-border-default pt-4">
        <p class="text-sm text-neutral-400">
          Configure and publish your status page to make it visible to everyone.
        </p>
      </div>
    {/if}
  </div>
{/if}
