<script lang="ts">
  import { goto } from '$app/navigation';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import {
    SettingsCard,
    SettingsCardHeader,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import EditIcon from '$lib/domains/shared/icons/EditIcon.svelte';
  import HashIcon from '$lib/domains/shared/icons/HashIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
  };

  const { clusterId, projectId }: Props = $props();

  const project = $derived(
    clustersState.clusters
      .find((c) => c.id === clusterId)
      ?.projects?.find((p) => p.id === projectId),
  );

  let newName = $state('');
  let isEditingName = $state(false);

  $effect(() => {
    if (project?.name) {
      newName = project.name;
    }
  });

  async function onCopyApiKey(): Promise<void> {
    const key = await projectsState.getApiKey(projectId);
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard', 5000);
  }

  function onCopyServiceId(): void {
    navigator.clipboard.writeText(projectId);
    toast.success('Service ID copied to clipboard', 5000);
  }

  function onStartRenaming(): void {
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
    newName = project?.name || '';
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

    await projectsState.updateProject(projectId, newName);
    toast.success('Service name updated successfully', 5000);
    isEditingName = false;
  }

  async function onDeleteService(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete this service? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    await projectsState.deleteProject(projectId);
    await clustersState.load();
    goto(`/app/clusters/${clusterId}`);
    toast.success('Service deleted successfully', 5000);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      onSaveRename();
    }

    if (e.key === 'Escape') {
      onCancelRenaming();
    }
  }

  const basePath = $derived(`/app/clusters/${clusterId}/${projectId}`);

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
      icon: typeof LogsIcon;
      path: string;
    }> = [];

    if (!hasLogging) {
      features.push({
        id: Feature.LOGGING,
        label: 'Logging',
        description: 'Collect and analyze logs from your service',
        icon: LogsIcon,
        path: `${basePath}/logs`,
      });
    }

    if (!hasMetrics) {
      features.push({
        id: Feature.METRICS,
        label: 'Metrics',
        description: 'Track custom metrics and performance indicators',
        icon: MetricsIcon,
        path: `${basePath}/metrics`,
      });
    }

    if (!hasMonitoring) {
      features.push({
        id: Feature.MONITORING,
        label: 'Monitoring',
        description: 'Monitor uptime with HTTP health checks',
        icon: MonitoringIcon,
        path: `${basePath}/monitoring`,
      });
    }

    return features;
  });

  let addingFeature = $state<Feature | null>(null);

  async function onAddFeature(feature: Feature, path: string): Promise<void> {
    addingFeature = feature;
    await projectsState.addFeature(projectId, feature);
    addingFeature = null;
    goto(path);
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6">
  <SettingsCard>
    <SettingsCardHeader
      title="API Keys"
      description="Access keys for integrating with this service"
    />

    <SettingsCardItem icon={KeyIcon} showBorder={false} onclick={onCopyApiKey}>
      {#snippet children()}
        <p class="font-medium">Service API Key</p>
        <p class="text-base-content/60 text-sm">
          Click to copy the API key to clipboard
        </p>
      {/snippet}
      {#snippet action()}
        {#if projectsState.isLoadingApiKey(projectId)}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <CopyIcon class="size-5 text-base-content/60" />
        {/if}
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>

  <SettingsCard>
    <SettingsCardHeader
      title="Service Information"
      description="Basic details about your service"
    />

    <SettingsCardItem icon={EditIcon} showBorder={true}>
      {#snippet children()}
        <p class="text-base-content/60 text-sm">Service Name</p>
        {#if isEditingName}
          <input
            bind:value={newName}
            class="input input-sm mt-1 w-64"
            placeholder="Enter service name"
            onkeydown={onKeyDown}
          />
        {:else}
          <p class="font-medium">{project?.name || 'Unknown'}</p>
        {/if}
      {/snippet}
      {#snippet action()}
        {#if isEditingName}
          <button
            onclick={onCancelRenaming}
            class="btn btn-ghost btn-sm"
            disabled={projectsState.isUpdatingProject(projectId)}
          >
            Cancel
          </button>
          <button
            onclick={onSaveRename}
            class="btn btn-primary btn-sm"
            disabled={projectsState.isUpdatingProject(projectId)}
          >
            {#if projectsState.isUpdatingProject(projectId)}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              Save
            {/if}
          </button>
        {:else}
          <button
            onclick={onStartRenaming}
            class="btn btn-ghost btn-sm text-base-content/60"
          >
            Rename
          </button>
        {/if}
      {/snippet}
    </SettingsCardItem>

    <SettingsCardItem icon={HashIcon} showBorder={false}>
      {#snippet children()}
        <p class="text-base-content/60 text-sm">Service ID</p>
        <p class="font-mono text-sm">{projectId}</p>
      {/snippet}
      {#snippet action()}
        <button
          onclick={onCopyServiceId}
          class="btn btn-ghost btn-sm text-base-content/60"
        >
          <CopyIcon class="size-4" />
        </button>
      {/snippet}
    </SettingsCardItem>
  </SettingsCard>

  {#if availableFeatures.length > 0}
    <SettingsCard>
      <SettingsCardHeader
        title="Features"
        description="Add additional capabilities to your service"
        icon={CubeIcon}
      />

      {#each availableFeatures as feature, index (feature.id)}
        <SettingsCardItem
          icon={feature.icon}
          showBorder={index < availableFeatures.length - 1}
        >
          {#snippet children()}
            <p class="font-medium">{feature.label}</p>
            <p class="text-base-content/60 text-sm">{feature.description}</p>
          {/snippet}
          {#snippet action()}
            <button
              onclick={() => onAddFeature(feature.id, feature.path)}
              disabled={addingFeature !== null}
              class="btn btn-primary btn-outline btn-sm"
              data-posthog-id="add-feature-settings-button"
            >
              {#if addingFeature === feature.id}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <PlusIcon class="size-4" />
                Add
              {/if}
            </button>
          {/snippet}
        </SettingsCardItem>
      {/each}
    </SettingsCard>
  {/if}

  <SettingsCard variant="danger">
    <SettingsCardHeader
      title="Danger Zone"
      description="Irreversible actions that affect your service"
      icon={DangerIcon}
      variant="danger"
    />

    <div class="ld-card-bg">
      <SettingsCardItem
        icon={TrashIcon}
        iconVariant="danger"
        showBorder={false}
      >
        {#snippet children()}
          <p class="font-medium">Delete Service</p>
          <p class="text-base-content/60 text-sm">
            Permanently delete this service and all its data
          </p>
        {/snippet}
        {#snippet action()}
          <button
            onclick={onDeleteService}
            disabled={projectsState.isDeletingProject(projectId)}
            class="btn btn-error btn-outline btn-sm"
          >
            {#if projectsState.isDeletingProject(projectId)}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              Delete
            {/if}
          </button>
        {/snippet}
      </SettingsCardItem>
    </div>
  </SettingsCard>
</div>
