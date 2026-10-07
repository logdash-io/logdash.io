<script lang="ts">
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { debounce } from '$lib/domains/shared/utils/debounce.js';
  import { displayUrl, stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import { TOOLBAR_CONTROL } from '$lib/domains/shared/ui/components/toolbar.js';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import LoadingLine from '$lib/domains/shared/ui/components/LoadingLine.svelte';
  import {
    SETTINGS_PAGE_CLASS,
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import CustomDomainSetup from '../public-dashboard/CustomDomainSetup.svelte';
  import BadgePicker from './BadgePicker.svelte';
  import BuildYourOwn from './BuildYourOwn.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import { onMount, type Snippet } from 'svelte';
  import { Button, Checkbox, Input } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
    dashboardId: string;
  };
  const { clusterId, dashboardId }: Props = $props();

  const FIELD_CLASS =
    'border-surface-50-border bg-surface-50-bg h-8 w-full rounded-lg px-2.5 text-sm';

  let dashboardName = $state('');
  let isUpdating = $state(false);
  let isPublishing = $state(false);
  let isDeleting = $state(false);
  let hasInitialized = $state(false);
  let loadFailed = $state(false);

  const debouncedNameUpdate = debounce(async (name: string) => {
    try {
      await publicDashboardManagerState.update(dashboardId, { name });
    } catch (error) {
      toast.error(failureMessage('Failed to rename status page', error));
    }
  }, 250);

  const dashboard = $derived(
    publicDashboardManagerState.getDashboard(dashboardId),
  );
  const dashboardMonitors = $derived(dashboard?.httpMonitorsIds ?? []);
  const isPublished = $derived(dashboard?.isPublic ?? false);

  const statusPageUrl = $derived(
    publicDashboardManagerState.getStatusPageUrl(dashboardId),
  );
  const monitors = $derived(monitoringState.monitorsOf(clusterId));
  const badgeMonitors = $derived(
    monitors.filter((monitor) => dashboardMonitors.includes(monitor.id)),
  );

  $effect(() => topBarState.show(toolbar));

  onMount(() => {
    void monitoringState.load(clusterId);
    void loadDashboard();
  });

  async function loadDashboard(): Promise<void> {
    hasInitialized = false;
    loadFailed =
      !(await publicDashboardManagerState.loadPublicDashboards(clusterId));
    dashboardName = dashboard?.name ?? '';
    hasInitialized = true;
  }

  function onNameInput(
    event: Event & { currentTarget: HTMLInputElement },
  ): void {
    const name = event.currentTarget.value;
    if (!name.trim()) return;

    debouncedNameUpdate(name);
  }

  async function onToggleAutoAdd(): Promise<void> {
    try {
      await publicDashboardManagerState.update(dashboardId, {
        autoAddMonitors: !dashboard?.autoAddMonitors,
      });
    } catch (error) {
      toast.error(failureMessage('Failed to update monitors', error));
    }
  }

  async function onToggleMonitor(monitorId: string): Promise<void> {
    isUpdating = true;
    try {
      await publicDashboardManagerState.toggleMonitor(dashboardId, monitorId);
    } catch (error) {
      toast.error(failureMessage('Failed to update monitors', error));
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

  async function onDelete(): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Delete status page',
      description: 'Its link and badges stop working. This cannot be undone.',
      confirmLabel: 'Delete status page',
    });

    if (!confirmed || isDeleting) return;
    isDeleting = true;

    try {
      await publicDashboardManagerState.delete(dashboardId);
      toast.success('Status page deleted');
      await goto(
        resolve('/app/domains/[cluster_id]/status-pages', {
          cluster_id: clusterId,
        }),
        { invalidateAll: true },
      );
    } catch (error) {
      toast.error(failureMessage('Failed to delete status page', error));
    } finally {
      isDeleting = false;
    }
  }

  async function onCopyUrl(): Promise<void> {
    await navigator.clipboard.writeText(statusPageUrl);
    toast.success('Status page URL copied to clipboard');
  }

  function failureMessage(message: string, error: unknown): string {
    const reason = readHttpErrorMessage(error);

    return reason ? `${message}: ${reason}` : message;
  }
</script>

{#if !hasInitialized}
  <div class="flex h-11 items-center px-5 py-2">
    <LoadingLine label="Loading status page" />
  </div>
{:else if !dashboard && loadFailed}
  <EmptyState
    class="p-4"
    title="Could not load this status page"
    description="Check your connection and try again."
  >
    <Button size="sm" onclick={loadDashboard}>Try again</Button>
  </EmptyState>
{:else if !dashboard}
  <EmptyState
    class="p-4"
    title="Status page not found"
    description="It may have been deleted, or it belongs to another domain."
  >
    <Button
      href={resolve('/app/domains/[cluster_id]/status-pages', {
        cluster_id: clusterId,
      })}
      size="sm"
    >
      Back to status pages
    </Button>
  </EmptyState>
{:else}
  <div class={SETTINGS_PAGE_CLASS}>
    {@render section(
      'Name',
      'Shown in the header of your status page.',
      nameField,
    )}
    {@render section(
      'Monitors',
      'The monitors your status page shows.',
      monitorsField,
    )}
    {@render section(
      'Visibility',
      'Once published, anyone with the link can view your status page.',
      visibilityField,
    )}
    {@render section(
      'Custom URL',
      'Serve your status page from your own address, like status.example.com.',
      customDomainField,
    )}

    {#if isPublished}
      {@render section(
        'README badges',
        'Show your uptime in a README or on your website.',
        badgesField,
      )}
      {@render section(
        'Build your own',
        'Build a status page in your own design with the public status page API, or start from the Next.js starter.',
        buildYourOwnField,
      )}
    {/if}

    <SettingsCard
      title="Danger zone"
      description="Actions that cannot be undone."
      variant="danger"
    >
      <SettingsCardItem>
        <p>Delete status page</p>
        <p class="text-fg-muted">
          Removes this status page. Its link and badges stop working.
        </p>

        {#snippet action()}
          <Button
            variant="danger"
            size="sm"
            loading={isDeleting}
            onclick={onDelete}
          >
            Delete
          </Button>
        {/snippet}
      </SettingsCardItem>
    </SettingsCard>
  </div>
{/if}

{#snippet section(title: string, description: string, field: Snippet)}
  <SettingsCard {title} {description}>
    <div class="min-w-0 px-3 pt-2 pb-3">
      {@render field()}
    </div>
  </SettingsCard>
{/snippet}

{#snippet nameField()}
  <Input
    aria-label="Status page name"
    bind:value={dashboardName}
    oninput={onNameInput}
    class={FIELD_CLASS}
    placeholder="Status page"
    type="text"
  />
{/snippet}

{#snippet monitorsField()}
  <div class="flex flex-col gap-3">
    <label class="flex cursor-pointer items-start gap-3 text-sm select-none">
      <Checkbox
        size="xs"
        variant="primary"
        class="mt-0.5"
        checked={dashboard?.autoAddMonitors ?? false}
        onchange={onToggleAutoAdd}
      />
      <span class="flex flex-col gap-0.5">
        <span>Add new monitors automatically</span>
        <span class="text-fg-muted text-[13px]">
          Every monitor you add to this domain shows up here.
        </span>
      </span>
    </label>

    {#if monitors.length === 0}
      <div class="flex flex-col items-start gap-2">
        <p class="text-fg-muted text-sm">
          No monitors yet. Add one in Uptime and it shows up here.
        </p>
        <Button
          href={resolve('/app/domains/[cluster_id]/uptime/new', {
            cluster_id: clusterId,
          })}
          size="sm"
        >
          Add a monitor
        </Button>
      </div>
    {:else}
      <ul class="edge-between overflow-hidden rounded-lg edge">
        {#each monitors as monitor (monitor.id)}
          <li>
            <label
              class="hover:bg-surface-25-hover-bg flex h-10 cursor-pointer items-center gap-3 px-3 text-sm select-none"
            >
              <Checkbox
                size="xs"
                variant="primary"
                checked={dashboardMonitors.includes(monitor.id)}
                disabled={isUpdating}
                onchange={() => onToggleMonitor(monitor.id)}
              />
              <span class="min-w-0 truncate">
                {monitor.name || stripProtocol(monitor.url ?? '')}
              </span>
              {#if monitor.url}
                <span class="text-fg-muted ml-auto min-w-0 truncate pl-2">
                  {displayUrl(monitor.url)}
                </span>
              {/if}
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/snippet}

{#snippet visibilityField()}
  {#if isPublished}
    <div class="flex flex-col items-start gap-3">
      <div class="flex w-full items-center gap-2">
        <span
          class={[FIELD_CLASS, 'flex min-w-0 items-center border font-mono']}
        >
          <span class="truncate">{stripProtocol(statusPageUrl)}</span>
        </span>
        <IconButton
          label="Copy status page URL"
          tooltip="Copy URL"
          onclick={onCopyUrl}
        >
          <CopyIcon class="size-4" />
        </IconButton>
      </div>

      <Button
        variant="danger"
        size="sm"
        loading={isPublishing}
        onclick={onUnpublish}
      >
        Unpublish
      </Button>
    </div>
  {:else}
    <div class="flex flex-col items-start gap-3">
      <p class="text-sm text-fg-muted">
        Your status page stays private until you publish it.
      </p>
      <Button
        variant="primary"
        size="sm"
        loading={isPublishing}
        onclick={onPublish}
      >
        Publish status page
      </Button>
    </div>
  {/if}
{/snippet}

{#snippet customDomainField()}
  <CustomDomainSetup
    {dashboardId}
    canSetup={clustersState.canSetupCustomDomain(clusterId)}
  />
{/snippet}

{#snippet badgesField()}
  {#if badgeMonitors.length === 0}
    <p class="text-sm text-fg-muted">
      Pick monitors above to get their badges.
    </p>
  {:else}
    <BadgePicker {dashboardId} {statusPageUrl} monitors={badgeMonitors} />
  {/if}
{/snippet}

{#snippet buildYourOwnField()}
  <BuildYourOwn {dashboardId} />
{/snippet}

{#snippet toolbar()}
  {#if dashboard}
    <div class="flex flex-wrap items-center gap-2">
      <span
        class="bg-surface-100-bg text-fg-secondary flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px]"
      >
        <span
          class={[
            'size-1.5 rounded-full',
            isPublished ? 'bg-success' : 'bg-idle',
          ]}
        ></span>
        {isPublished ? 'Published' : 'Draft'}
      </span>

      {#if isPublished}
        <!-- eslint-disable svelte/no-navigation-without-resolve -- the public URL can be a custom domain -->
        <a
          href={statusPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          class={TOOLBAR_CONTROL}
        >
          Open
          <OpenIcon class="size-3.5 shrink-0" />
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      {/if}
    </div>
  {/if}
{/snippet}
