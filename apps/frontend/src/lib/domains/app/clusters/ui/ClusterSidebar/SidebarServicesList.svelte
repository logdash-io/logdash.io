<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { serviceEntries } from '$lib/domains/app/clusters/application/service-entries.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import {
    listServices,
    type ServiceItem,
  } from '$lib/domains/app/clusters/domain/service-groups.js';
  import {
    getStatusFromMonitor,
    SERVICE_STATUS_DOT,
  } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import {
    Button,
    Checkbox,
    Input,
    Tooltip,
  } from '@logdash/hyper-ui/presentational';
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
  const items = $derived.by((): ServiceItem[] => {
    const { services, dependencies } = listServices(
      serviceEntries(currentCluster),
    );

    return [...services, ...dependencies];
  });

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
    if (!clusterId) {
      return;
    }

    void goto(
      resolve('/app/clusters/[cluster_id]/[project_id]', {
        cluster_id: clusterId,
        project_id: projectId,
      }),
    );
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
      await goto(
        resolve('/app/clusters/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: result.project.id,
        }),
        { invalidateAll: true },
      );
    } catch {
      toast.error('Failed to create service');
    } finally {
      isCreating = false;
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && canCreate) {
      void onCreateService();
    } else if (e.key === 'Escape') {
      onCloseForm();
    }
  }
</script>

{#each items as item (item.id)}
  {@render serviceRow(item)}
{/each}

{#if isWizardMode && items.length === 0}
  <span class="pl-8 py-1 text-[13px] text-neutral-600 italic">
    No services yet
  </span>
{/if}

{#if !isWizardMode && clusterId}
  {@render newService()}
{/if}

{#snippet serviceRow(item: ServiceItem)}
  {@const isActive = !isWizardMode && item.id === activeProjectId}
  {@const monitor = isWizardMode
    ? undefined
    : monitoringState.getMonitorByProjectId(item.id)}
  <SidebarMenuItem
    onclick={() => onServiceSelect(item.id)}
    {isActive}
    disabled={!clusterId}
    class="pl-8"
  >
    <span class="flex size-3.5 shrink-0 items-center justify-center">
      {#if monitor}
        {#snippet monitorTooltipContent()}
          <MonitorStatus projectId={item.id}>
            {null}
          </MonitorStatus>
        {/snippet}
        <Tooltip content={monitorTooltipContent} placement="bottom">
          <span
            class={[
              'size-1.5 rounded-full',
              SERVICE_STATUS_DOT[getStatusFromMonitor(monitor)],
            ]}
          ></span>
        </Tooltip>
      {:else}
        <span class="size-1.5 rounded-full bg-neutral-600"></span>
      {/if}
    </span>
    <span class="truncate">{item.label || 'New Service'}</span>
    {#if item.host}
      <span
        class="text-neutral-600 ml-auto min-w-6 shrink-[4] truncate text-xs"
      >
        {item.host}
      </span>
    {/if}
  </SidebarMenuItem>
{/snippet}

{#snippet newService()}
  {#if isFormOpen}
    <div
      class="ld-card-bg ld-card-border mt-1 ml-6 flex shrink-0 flex-col gap-2 rounded-lg p-2"
      in:fly={{ y: -5, duration: 200, easing: cubicOut }}
    >
      <Input
        id="new-service-name-input"
        type="text"
        placeholder="Service name"
        size="sm"
        class="w-full"
        bind:value={serviceName}
        onkeydown={onKeyDown}
        maxlength={64}
      />

      <div class="flex flex-col gap-0.5">
        {#each featureConfig as { feature, label, icon: Icon } (feature)}
          <label
            class={[
              'flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs hover:bg-neutral-800',
              { 'text-brand': isFeatureEnabled(feature) },
            ]}
          >
            <Checkbox
              size="xs"
              variant="primary"
              checked={isFeatureEnabled(feature)}
              onchange={() => onToggleFeature(feature)}
            />
            <Icon class="size-3.5 shrink-0" />
            <span>{label}</span>
          </label>
        {/each}
      </div>

      <div class="flex items-center gap-1.5 mt-1">
        <Button
          variant="primary"
          size="xs"
          class="flex-1"
          onclick={onCreateService}
          disabled={!canCreate}
          loading={isCreating}
        >
          Create
        </Button>
        <Button variant="ghost" size="xs" onclick={onCloseForm}>Cancel</Button>
      </div>
    </div>
  {:else}
    <SidebarMenuItem onclick={onOpenForm} class="pl-8 text-neutral-500">
      <PlusIcon class="size-3.5 shrink-0" />
      <span class="truncate">New service</span>
    </SidebarMenuItem>
  {/if}
{/snippet}
