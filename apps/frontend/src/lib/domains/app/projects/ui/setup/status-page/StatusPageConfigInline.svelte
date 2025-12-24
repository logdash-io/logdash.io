<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { debounce } from '$lib/domains/shared/utils/debounce.js';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import CustomDomainSetup from '../public-dashboard/CustomDomainSetup.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import { onMount } from 'svelte';
  import { ArrowLeftIcon } from 'lucide-svelte';
  import EditIcon from '$lib/domains/shared/icons/EditIcon.svelte';

  type Props = {
    clusterId: string;
    dashboardId: string;
  };
  const { clusterId, dashboardId }: Props = $props();

  const backUrl = $derived(`/app/clusters/${clusterId}/status-pages`);

  let dashboardName = $state('');
  let isUpdating = $state(false);
  let isPublishing = $state(false);
  let hasInitialized = $state(false);

  const debouncedNameUpdate = debounce((name: string) => {
    publicDashboardManagerState.update(dashboardId, { name });
  }, 250);

  const dashboard = $derived(
    publicDashboardManagerState.getDashboard(dashboardId),
  );
  const dashboardMonitors = $derived(dashboard?.httpMonitorsIds ?? []);
  const isPublished = $derived(dashboard?.isPublic ?? false);

  const totalPublishedCount = $derived(clustersState.publishedDashboardsCount);
  const maxAllowed = $derived(
    exposedConfigState.maxNumberOfPublicDashboards(userState.tier),
  );
  const canPublish = $derived(isPublished || totalPublishedCount < maxAllowed);

  const dashboardUrl = $derived(
    publicDashboardManagerState.getDashboardUrl(dashboardId),
  );

  onMount(async () => {
    await monitoringState.load(clusterId);
    await publicDashboardManagerState.loadPublicDashboards(clusterId);
    hasInitialized = true;

    if (dashboard?.name) {
      dashboardName = dashboard.name;
    }
  });

  $effect(() => {
    if (!hasInitialized) return;
    if (!dashboard?.name) return;
    if (dashboardName) return;

    dashboardName = dashboard.name;
  });

  $effect(() => {
    if (!hasInitialized) return;
    if (!dashboardName.trim()) return;

    debouncedNameUpdate(dashboardName);
  });

  async function onToggleMonitor(monitorId: string): Promise<void> {
    isUpdating = true;
    try {
      await publicDashboardManagerState.toggleMonitor(dashboardId, monitorId);
    } finally {
      isUpdating = false;
    }
  }

  async function onPublish(): Promise<void> {
    if (isPublishing) return;
    isPublishing = true;

    try {
      await publicDashboardManagerState.update(dashboardId, { isPublic: true });
      await invalidateAll();
      toast.success('Status page is now public');
      // window.open(dashboardUrl, '_blank');
    } catch {
      toast.error('Failed to publish status page');
    } finally {
      isPublishing = false;
    }
  }

  async function onUnpublish(): Promise<void> {
    if (isPublishing) return;
    isPublishing = true;

    try {
      await publicDashboardManagerState.update(dashboardId, {
        isPublic: false,
      });
      await invalidateAll();
      toast.success('Status page is now unpublished');
    } catch {
      toast.error('Failed to unpublish status page');
    } finally {
      isPublishing = false;
    }
  }

  function onCopyUrl(): void {
    navigator.clipboard.writeText(dashboardUrl);
    toast.success('Status page URL copied to clipboard');
  }

  function onOpenStatusPage(): void {
    window.open(dashboardUrl, '_blank');
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6 ld-card">
  <div class="flex flex-col space-y-2">
    <div class="flex items-center gap-2">
      <a href={backUrl} class="btn btn-ghost btn-sm btn-square">
        <ArrowLeftIcon class="size-5" />
      </a>
      <h5 class="text-lg md:text-2xl font-semibold">
        Configure your status page
      </h5>
    </div>

    <p class="text-base-content opacity-60 text-sm">
      Customize how your status page will look like for your users.
    </p>

    <div class="flex items-center justify-start gap-2">
      <div
        class={[
          'badge badge-soft gap-1',
          {
            'badge-success': isPublished,
            'badge-secondary': !isPublished,
          },
        ]}
      >
        {#if isPublished}
          <CheckIcon class="size-3" />
        {:else}
          <EditIcon class="size-3" />
        {/if}
        {isPublished ? 'Published' : 'Draft'}
      </div>

      {#if isPublished}
        <a
          href={dashboardUrl}
          target="_blank"
          class="btn btn-xs btn-secondary gap-1"
        >
          <OpenIcon class="size-3.5" />
          Open
        </a>
      {/if}
    </div>
  </div>

  <div class="space-y-6">
    <div class="space-y-3">
      <label class="label font-medium">1. Select monitors to display</label>
      <div
        class="border-base-100 w-full max-w-full overflow-hidden rounded-2xl border"
      >
        {#if !hasInitialized}
          <div class="flex items-center justify-start py-3 px-3.5">
            <span class="loading loading-spinner loading-xs"></span>
          </div>
        {:else if monitoringState.monitors.length === 0}
          <div class="flex flex-col items-center justify-center gap-2 py-6">
            <span class="text-base-content/60 text-center text-sm">
              No HTTP monitors available
            </span>
            <a
              href="/app/clusters/{clusterId}"
              class="link link-primary text-sm"
            >
              Create a monitor first
            </a>
          </div>
        {:else}
          {#each monitoringState.monitors as monitor, index}
            <label
              class={[
                'hover:bg-base-100/50 flex cursor-pointer select-none items-center gap-2 p-2 px-3 transition-all',
                { 'border-base-100 border-t': index > 0 },
              ]}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary"
                checked={dashboardMonitors.includes(monitor.id)}
                disabled={isUpdating}
                onchange={() => onToggleMonitor(monitor.id)}
              />
              <span class="truncate font-medium">
                {monitor.name || stripProtocol(monitor.url)}
              </span>
            </label>
          {/each}
        {/if}
      </div>
    </div>

    <div class="space-y-3">
      <label class="label font-medium" for="status-page-name">
        2. Status page name
      </label>
      <input
        id="status-page-name"
        bind:value={dashboardName}
        class="input input-bordered w-full"
        placeholder="Status Page"
        type="text"
      />
      <p class="text-xs text-base-content/60">
        This name will appear in the header of your status page.
      </p>
    </div>

    <div class="space-y-3">
      <label class="label font-medium">
        3. Custom domain (like status.example.com)
      </label>
      <CustomDomainSetup {dashboardId} />
    </div>

    <div class="space-y-3">
      <label class="label font-medium">4. Manage visibility</label>

      <div class="border-base-100 flex flex-col gap-4 rounded-2xl border p-4">
        {#if isPublished}
          <div class="flex flex-wrap items-center gap-2">
            <button onclick={onCopyUrl} class="btn btn-sm btn-ghost gap-1">
              <CopyIcon class="size-4" />
              Copy URL
            </button>
            <button
              onclick={onUnpublish}
              disabled={isPublishing}
              class="btn btn-sm btn-error"
            >
              {#if isPublishing}
                <span class="loading loading-spinner w-3"></span>
              {/if}
              Unpublish
            </button>
          </div>
        {:else if canPublish}
          <p class="text-sm text-base-content/60">
            Once published, anyone with the link can view your status page.
          </p>

          <div class="flex items-center gap-3">
            <button
              onclick={onPublish}
              disabled={isPublishing}
              class="btn btn-primary btn-sm"
            >
              {#if isPublishing}
                <span class="loading loading-spinner loading-xs"></span>
              {/if}
              Publish status page
            </button>
          </div>
        {:else}
          <p class="text-sm text-base-content/60">
            You've reached the limit of {maxAllowed} published status page{maxAllowed ===
            1
              ? ''
              : 's'} on your plan.
          </p>

          <UpgradeButton source="status-page-limit">
            Upgrade to publish more status pages
          </UpgradeButton>
        {/if}
      </div>
    </div>
  </div>
</div>
