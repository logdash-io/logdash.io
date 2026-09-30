<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import {
    SETTINGS_INPUT_CLASS,
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Button, Input } from '@logdash/hyper-ui/presentational';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
  };

  type FeatureRoute =
    | '/app/domains/[cluster_id]/[project_id]/logs'
    | '/app/domains/[cluster_id]/[project_id]/metrics'
    | '/app/domains/[cluster_id]/[project_id]/monitoring';

  const { clusterId, projectId }: Props = $props();

  const project = $derived(
    clustersState.clusters
      .find((c) => c.id === clusterId)
      ?.projects?.find((p) => p.id === projectId),
  );

  let newName = $state('');
  let isEditingName = $state(false);

  async function onCopyApiKey(): Promise<void> {
    try {
      const key = await projectsState.getApiKey(projectId);
      await navigator.clipboard.writeText(key);
      toast.success('API key copied to clipboard', 5000);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to copy the API key: ${message}`, 5000);
    }
  }

  async function onCopyServiceId(): Promise<void> {
    await navigator.clipboard.writeText(projectId);
    toast.success('Service ID copied to clipboard', 5000);
  }

  function onStartRenaming(): void {
    newName = project?.name ?? '';
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
  }

  async function onSaveRename(): Promise<void> {
    if (!newName || newName.trim() === '') {
      toast.warning('Service name cannot be empty', 5000);
      return;
    }

    if (newName === project?.name) {
      isEditingName = false;
      return;
    }

    try {
      await projectsState.updateProject(projectId, newName);
      toast.success('Service name updated', 5000);
      isEditingName = false;
    } catch {
      toast.error('Failed to update the service name', 5000);
    }
  }

  async function onDeleteService(): Promise<void> {
    const confirmed = confirm(
      'Delete this service? Its logs, metrics and monitors will be deleted. This cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    try {
      await projectsState.deleteProject(projectId);
      await clustersState.load();
      void goto(
        resolve('/app/domains/[cluster_id]', { cluster_id: clusterId }),
      );
      toast.success('Service deleted', 5000);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to delete service: ${message}`, 5000);
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      void onSaveRename();
    }

    if (e.key === 'Escape') {
      onCancelRenaming();
    }
  }

  const hasLogging = $derived(
    projectsState.hasFeature(projectId, Feature.LOGGING),
  );
  const hasMetrics = $derived(
    projectsState.hasFeature(projectId, Feature.METRICS),
  );
  const hasMonitoring = $derived(
    projectsState.hasFeature(projectId, Feature.MONITORING),
  );

  const availableFeatures = $derived.by(() => {
    const features: Array<{
      id: Feature;
      label: string;
      description: string;
      route: FeatureRoute;
    }> = [];

    if (!hasLogging) {
      features.push({
        id: Feature.LOGGING,
        label: 'Logging',
        description: 'Collect and search the logs your app writes.',
        route: '/app/domains/[cluster_id]/[project_id]/logs',
      });
    }

    if (!hasMetrics) {
      features.push({
        id: Feature.METRICS,
        label: 'Metrics',
        description: 'Track the numbers your app reports.',
        route: '/app/domains/[cluster_id]/[project_id]/metrics',
      });
    }

    if (!hasMonitoring) {
      features.push({
        id: Feature.MONITORING,
        label: 'Monitoring',
        description: 'Check that your site is up.',
        route: '/app/domains/[cluster_id]/[project_id]/monitoring',
      });
    }

    return features;
  });

  let addingFeature = $state<Feature | null>(null);

  async function onAddFeature(
    feature: Feature,
    route: FeatureRoute,
  ): Promise<void> {
    addingFeature = feature;

    try {
      await projectsState.addFeature(projectId, feature);
      void goto(
        resolve(route, { cluster_id: clusterId, project_id: projectId }),
      );
    } catch {
      return;
    } finally {
      addingFeature = null;
    }
  }
</script>

<div class="flex w-full flex-col">
  <SettingsCard title="API key" description="Your app sends data with it.">
    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-neutral-500 w-16 shrink-0">Key</span>
        <span class="text-neutral-500 truncate font-mono" aria-hidden="true">
          ••••••••••••••••
        </span>
      </div>

      {#snippet action()}
        <Button
          variant="neutral"
          size="sm"
          onclick={onCopyApiKey}
          loading={projectsState.isLoadingApiKey(projectId)}
        >
          <CopyIcon class="size-4" />
          Copy
        </Button>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>

  <SettingsCard title="Service" description="Its name and ID.">
    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-neutral-500 w-16 shrink-0">Name</span>
        {#if isEditingName}
          <Input
            bind:value={newName}
            size="sm"
            class={['-my-1.5 w-full max-w-64', SETTINGS_INPUT_CLASS]}
            placeholder="Service name"
            aria-label="Service name"
            autofocus
            onkeydown={onKeyDown}
          />
        {:else}
          <span class="truncate">{project?.name || 'Unknown'}</span>
        {/if}
      </div>

      {#snippet action()}
        {#if isEditingName}
          <Button
            variant="ghost"
            size="sm"
            onclick={onCancelRenaming}
            disabled={projectsState.isUpdatingProject(projectId)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onclick={onSaveRename}
            loading={projectsState.isUpdatingProject(projectId)}
          >
            Save
          </Button>
        {:else}
          <Button variant="neutral" size="sm" onclick={onStartRenaming}>
            Rename
          </Button>
        {/if}
      {/snippet}
    </SettingsCardItem>

    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-neutral-500 w-16 shrink-0">ID</span>
        <span class="truncate font-mono">{projectId}</span>
      </div>

      {#snippet action()}
        <IconButton
          label="Copy service ID"
          class="-mr-1.5"
          onclick={onCopyServiceId}
        >
          <CopyIcon class="size-4" />
        </IconButton>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>

  {#if availableFeatures.length > 0}
    <SettingsCard title="Features" description="Add more to this service.">
      {#each availableFeatures as feature (feature.id)}
        <SettingsCardItem>
          <p>{feature.label}</p>
          <p class="text-neutral-500">{feature.description}</p>

          {#snippet action()}
            <Button
              variant="neutral"
              size="sm"
              onclick={() => onAddFeature(feature.id, feature.route)}
              disabled={addingFeature !== null}
              loading={addingFeature === feature.id}
              data-posthog-id="add-feature-settings-button"
            >
              <PlusIcon class="size-4" />
              Add
            </Button>
          {/snippet}
        </SettingsCardItem>
      {/each}
    </SettingsCard>
  {/if}

  <SettingsCard
    title="Danger zone"
    description="Actions that cannot be undone."
    variant="danger"
  >
    <SettingsCardItem>
      <p>Delete service</p>
      <p class="text-neutral-500">
        Removes this service with all its logs, metrics and monitors.
      </p>

      {#snippet action()}
        <Button
          variant="danger"
          size="sm"
          onclick={onDeleteService}
          loading={projectsState.isDeletingProject(projectId)}
        >
          Delete
        </Button>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>
</div>
