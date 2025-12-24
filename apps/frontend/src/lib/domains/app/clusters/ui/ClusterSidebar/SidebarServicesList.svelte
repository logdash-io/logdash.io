<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';
  import HexagonIcon from '$lib/domains/shared/icons/HexagonIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  let isFormOpen = $state(false);
  let isCreating = $state(false);
  let serviceName = $state('');
  let selectedFeatures = $state<Feature[]>([]);

  const isWizardMode = $derived(wizardState.isActive);

  const currentCluster = $derived(
    isWizardMode
      ? clustersState.get(wizardState.tempClusterId)
      : clustersState.get(page.params.cluster_id),
  );
  const activeProjectId = $derived(
    page.params.project_id || page.url.searchParams.get('project_id'),
  );
  const clusterId = $derived(
    isWizardMode ? wizardState.tempClusterId : page.params.cluster_id,
  );

  const featureConfig = [
    {
      feature: Feature.LOGGING,
      label: 'Logging',
      icon: LogsIcon,
    },
    {
      feature: Feature.METRICS,
      label: 'Metrics',
      icon: MetricsIcon,
    },
    {
      feature: Feature.MONITORING,
      label: 'Monitoring',
      icon: MonitoringIcon,
    },
  ];

  const canCreate = $derived(serviceName.length >= 1);

  function onServiceSelect(projectId: string): void {
    if (isWizardMode) {
      wizardState.scrollToSection(`service-${projectId}`);
      return;
    }
    goto(`/app/clusters/${page.params.cluster_id}/${projectId}`);
  }

  function getServiceHealthStatus(projectId: string): boolean | null {
    if (isWizardMode) return null;
    const monitor = monitoringState.getMonitorByProjectId(projectId);
    if (!monitor) {
      return null;
    }
    return monitoringState.isHealthy(monitor.id);
  }

  function hasMonitor(projectId: string): boolean {
    if (isWizardMode) return false;
    return !!monitoringState.getMonitorByProjectId(projectId);
  }

  function onOpenForm(): void {
    isFormOpen = true;
    serviceName = '';
    selectedFeatures = [];
    setTimeout(() => {
      document.getElementById('new-service-name-input')?.focus();
    }, 50);
  }

  function onCloseForm(): void {
    isFormOpen = false;
    serviceName = '';
    selectedFeatures = [];
  }

  function onToggleFeature(feature: Feature): void {
    if (selectedFeatures.includes(feature)) {
      selectedFeatures = selectedFeatures.filter((f) => f !== feature);
    } else {
      selectedFeatures = [...selectedFeatures, feature];
    }
  }

  function isFeatureEnabled(feature: Feature): boolean {
    return selectedFeatures.includes(feature);
  }

  async function onCreateService(): Promise<void> {
    if (isCreating || !clusterId || !canCreate) return;

    isCreating = true;
    try {
      const result = await ProjectsService.createProject(clusterId, {
        name: serviceName,
        selectedFeatures:
          selectedFeatures.length > 0 ? selectedFeatures : undefined,
      });

      onCloseForm();
      await goto(`/app/clusters/${clusterId}/${result.project.id}`, {
        invalidateAll: true,
      });
    } finally {
      isCreating = false;
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && canCreate) {
      onCreateService();
    } else if (e.key === 'Escape') {
      onCloseForm();
    }
  }
</script>

<div class="flex flex-1 flex-col gap-1">
  <span class="p-2 text-sm font-medium tracking-wide text-base-content/50">
    Services
  </span>
  <nav class="flex flex-col gap-0.5">
    {#each currentCluster?.projects || [] as project}
      {@const isActive = !isWizardMode && project.id === activeProjectId}
      {@const healthStatus = getServiceHealthStatus(project.id)}
      {@const projectHasMonitor = hasMonitor(project.id)}
      <SidebarMenuItem
        onclick={() => onServiceSelect(project.id)}
        {isActive}
        disabled={!clusterId}
      >
        {#if projectHasMonitor}
          {#snippet monitorTooltipContent()}
            <MonitorStatus projectId={project.id}>
              {null}
            </MonitorStatus>
          {/snippet}
          <Tooltip content={monitorTooltipContent} placement="bottom">
            <HexagonIcon
              class="size-4 shrink-0 {healthStatus === true
                ? 'text-success'
                : 'text-error'}"
            />
          </Tooltip>
        {:else}
          <HexagonIcon class="size-4 shrink-0 text-base-content/30" />
        {/if}
        <span class="truncate">{project.name || 'New Service'}</span>
      </SidebarMenuItem>
    {/each}

    {#if isWizardMode && (currentCluster?.projects || []).length === 0}
      <span class="px-3 py-2 text-sm italic text-base-content/30">
        No services yet
      </span>
    {/if}

    {#if !isWizardMode && clusterId}
      {#if isFormOpen}
        <div
          class="flex flex-col gap-2 p-2 mt-1 ld-card-bg ld-card-border rounded-lg"
          in:fly={{ y: -5, duration: 200, easing: cubicOut }}
        >
          <input
            id="new-service-name-input"
            type="text"
            placeholder="Service name"
            class="input input-sm input-bordered w-full"
            bind:value={serviceName}
            onkeydown={onKeyDown}
            maxlength={64}
          />

          <div class="flex flex-col gap-0.5">
            {#each featureConfig as { feature, label, icon: Icon }}
              <label
                class={[
                  'flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors hover:bg-base-100/60',
                  { 'text-primary': isFeatureEnabled(feature) },
                ]}
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary checkbox-xs"
                  checked={isFeatureEnabled(feature)}
                  onchange={() => onToggleFeature(feature)}
                />
                <Icon class="size-3.5 shrink-0" />
                <span>{label}</span>
              </label>
            {/each}
          </div>

          <div class="flex items-center gap-1.5 mt-1">
            <button
              class="btn btn-primary btn-xs flex-1"
              onclick={onCreateService}
              disabled={!canCreate || isCreating}
            >
              {#if isCreating}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                Create
              {/if}
            </button>
            <button class="btn btn-ghost btn-xs" onclick={onCloseForm}>
              Cancel
            </button>
          </div>
        </div>
      {:else}
        <SidebarMenuItem onclick={onOpenForm} isActive={false} disabled={false}>
          <PlusIcon class="size-4 shrink-0 text-base-content/50" />
          <span class="truncate text-base-content/50">Add service</span>
        </SidebarMenuItem>
      {/if}
    {/if}
  </nav>
</div>
