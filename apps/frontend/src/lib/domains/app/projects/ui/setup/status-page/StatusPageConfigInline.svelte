<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
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
  import BadgePicker from './BadgePicker.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import { onMount } from 'svelte';
  import { ArrowLeftIcon } from 'lucide-svelte';
  import EditIcon from '$lib/domains/shared/icons/EditIcon.svelte';
  import {
    Badge,
    Button,
    Checkbox,
    Input,
    Label,
    Spinner,
  } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
    dashboardId: string;
  };
  const { clusterId, dashboardId }: Props = $props();

  let dashboardName = $state('');
  let isUpdating = $state(false);
  let isPublishing = $state(false);
  let hasInitialized = $state(false);

  const debouncedNameUpdate = debounce((name: string) => {
    void publicDashboardManagerState.update(dashboardId, { name });
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
  const statusPageUrl = $derived(
    publicDashboardManagerState.getStatusPageUrl(dashboardId),
  );
  const badgeMonitors = $derived(
    monitoringState.monitors.filter((monitor) =>
      dashboardMonitors.includes(monitor.id),
    ),
  );

  onMount(async () => {
    monitoringState.load(clusterId);
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

  async function onCopyUrl(): Promise<void> {
    await navigator.clipboard.writeText(dashboardUrl);
    toast.success('Status page URL copied to clipboard');
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6 ld-card">
  <div class="flex flex-col space-y-2">
    <div class="flex items-center gap-2">
      <Button
        href={resolve('/app/clusters/[cluster_id]/status-pages', {
          cluster_id: clusterId,
        })}
        variant="ghost"
        size="sm"
        shape="square"
        aria-label="Back to status pages"
      >
        <ArrowLeftIcon class="size-5" />
      </Button>
      <h5 class="text-lg md:text-2xl font-medium">
        Configure your status page
      </h5>
    </div>

    <p class="text-neutral-400 text-sm">
      Customize how your status page will look like for your users.
    </p>

    <div class="flex items-center justify-start gap-2">
      <Badge variant={isPublished ? 'success' : 'neutral'} class="gap-1">
        {#if isPublished}
          <CheckIcon class="size-3" />
        {:else}
          <EditIcon class="size-3" />
        {/if}
        {isPublished ? 'Published' : 'Draft'}
      </Badge>

      {#if isPublished}
        <Button
          href={dashboardUrl}
          target="_blank"
          variant="primary"
          size="xs"
          class="gap-1"
        >
          <OpenIcon class="size-3.5" />
          Open
        </Button>
      {/if}
    </div>
  </div>

  <div class="space-y-6">
    <div class="space-y-3">
      <Label class="font-medium">1. Select monitors to display</Label>
      <div
        class="border-border-default w-full max-w-full overflow-hidden rounded-xl border"
      >
        {#if !hasInitialized}
          <div class="flex items-center justify-start py-3 px-3.5">
            <Spinner size="xs" />
          </div>
        {:else if monitoringState.monitors.length === 0}
          <div class="flex flex-col items-center justify-center gap-2 py-6">
            <span class="text-neutral-400 text-center text-sm">
              No HTTP monitors available
            </span>
            <a
              href={resolve('/app/clusters/[cluster_id]', {
                cluster_id: clusterId,
              })}
              class="text-fg-default text-sm underline hover:text-[color-mix(in_oklab,var(--fg-default)_80%,#000)] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Create a monitor first
            </a>
          </div>
        {:else}
          {#each monitoringState.monitors as monitor, index (monitor.id)}
            <label
              class={[
                'hover:bg-neutral-800 flex cursor-pointer select-none items-center gap-2 p-2 px-3',
                { 'border-border-default border-t': index > 0 },
              ]}
            >
              <Checkbox
                size="xs"
                variant="primary"
                checked={dashboardMonitors.includes(monitor.id)}
                disabled={isUpdating}
                onchange={() => onToggleMonitor(monitor.id)}
              />
              <span class="truncate font-medium">
                {monitor.name || stripProtocol(monitor.url ?? '')}
              </span>
            </label>
          {/each}
        {/if}
      </div>
    </div>

    <div class="space-y-3">
      <Label class="font-medium" for="status-page-name">
        2. Status page name
      </Label>
      <Input
        id="status-page-name"
        bind:value={dashboardName}
        class="w-full"
        placeholder="Status Page"
        type="text"
      />
      <p class="text-xs text-neutral-400">
        This name will appear in the header of your status page.
      </p>
    </div>

    <div class="space-y-3">
      <Label class="font-medium">
        3. Custom domain (like status.example.com)
      </Label>
      <CustomDomainSetup {dashboardId} />
    </div>

    <div class="space-y-3">
      <Label class="font-medium">4. Manage visibility</Label>

      <div
        class="border-border-default flex flex-col gap-4 rounded-xl border p-4"
      >
        {#if isPublished}
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" class="gap-1" onclick={onCopyUrl}>
              <CopyIcon class="size-4" />
              Copy URL
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isPublishing}
              onclick={onUnpublish}
            >
              Unpublish
            </Button>
          </div>
        {:else if canPublish}
          <p class="text-sm text-neutral-400">
            Once published, anyone with the link can view your status page.
          </p>

          <div class="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              loading={isPublishing}
              onclick={onPublish}
            >
              Publish status page
            </Button>
          </div>
        {:else}
          <p class="text-sm text-neutral-400">
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

    {#if isPublished}
      <div class="space-y-3">
        <Label class="font-medium">5. README badges</Label>
        <p class="text-sm text-neutral-400">
          Show your uptime in a README or on your website.
        </p>

        {#if badgeMonitors.length === 0}
          <p class="text-sm text-neutral-500">
            Select monitors above to get their badges.
          </p>
        {:else}
          <BadgePicker {dashboardId} {statusPageUrl} monitors={badgeMonitors} />
        {/if}
      </div>
    {/if}
  </div>
</div>
