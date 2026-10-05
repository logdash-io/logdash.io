<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { serviceEntries } from '$lib/domains/app/clusters/application/service-entries.js';
  import {
    listServices,
    type ServiceItem,
  } from '$lib/domains/app/clusters/domain/service-groups.js';
  import { getStatusFromMonitor } from '$lib/domains/app/clusters/application/get-status-from-monitor.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
  import MonitorStatus from '$lib/domains/app/projects/ui/monitor-status/MonitorStatus.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import { Button, Checkbox, Input } from '@logdash/hyper-ui/presentational';
  import { tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import SidebarNewServiceRow from './SidebarNewServiceRow.svelte';
  import SidebarServiceRow from './SidebarServiceRow.svelte';

  let isFormOpen = $state(false);
  let newServiceSlot: HTMLDivElement | null = null;
  let isCreating = $state(false);
  let serviceName = $state('');
  let selectedFeatures = $state<Feature[]>([]);

  const currentCluster = $derived(clustersState.get(page.params.cluster_id));
  const activeProjectId = $derived(
    page.params.project_id || page.url.searchParams.get('project_id'),
  );
  const clusterId = $derived(page.params.cluster_id);
  const items = $derived.by((): ServiceItem[] => {
    const { services, dependencies } = listServices(
      serviceEntries(currentCluster),
    );

    return [...services, ...dependencies];
  });

  const featureConfig = [
    {
      feature: Feature.LOGGING,
      label: 'Logs',
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
    if (!clusterId) {
      return;
    }

    void goto(
      resolve('/app/domains/[cluster_id]/[project_id]', {
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

  async function onCloseForm(): Promise<void> {
    const hadFocus = newServiceSlot?.contains(document.activeElement) ?? false;
    isFormOpen = false;
    serviceName = '';
    selectedFeatures = [];

    if (!hadFocus) return;
    await tick();
    newServiceSlot?.querySelector('button')?.focus();
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

      void onCloseForm();
      await goto(
        resolve('/app/domains/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: result.project.id,
        }),
        { invalidateAll: true },
      );
    } catch (error) {
      if (readHttpErrorStatus(error) === 409) {
        void onCloseForm();
        upgradeState.openModal('project-limit');
        return;
      }

      toast.error('Failed to create service');
    } finally {
      isCreating = false;
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && canCreate) {
      void onCreateService();
    }
  }

  function onFormKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      void onCloseForm();
    }
  }
</script>

{#each items as item (item.id)}
  {@render serviceRow(item)}
{/each}

{#if clusterId}
  {@render newService()}
{/if}

{#snippet serviceRow(item: ServiceItem)}
  {@const monitor = monitoringState.getMonitorByProjectId(item.id)}
  <SidebarServiceRow
    label={item.label || 'New service'}
    host={item.host}
    status={monitor ? getStatusFromMonitor(monitor) : undefined}
    tooltip={monitor ? monitorTooltip : undefined}
    active={item.id === activeProjectId}
    disabled={!clusterId}
    onclick={() => onServiceSelect(item.id)}
  />

  {#snippet monitorTooltip()}
    <MonitorStatus projectId={item.id}>
      {null}
    </MonitorStatus>
  {/snippet}
{/snippet}

{#snippet newService()}
  <div class="contents" bind:this={newServiceSlot}>
    {#if isFormOpen}
      <div
        role="presentation"
        class="ld-card-bg ld-card-border mt-1 ml-3 flex shrink-0 flex-col gap-2 rounded-lg p-2"
        in:fly={{ y: -5, duration: 200, easing: cubicOut }}
        onkeydown={onFormKeyDown}
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
                'flex items-center gap-2 p-1.5 rounded cursor-pointer text-[13px] hover:bg-surface-100-hover-bg',
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
          <Button variant="ghost" size="xs" onclick={onCloseForm}>
            Cancel
          </Button>
        </div>
      </div>
    {:else}
      <SidebarNewServiceRow onclick={onOpenForm} />
    {/if}
  </div>
{/snippet}
