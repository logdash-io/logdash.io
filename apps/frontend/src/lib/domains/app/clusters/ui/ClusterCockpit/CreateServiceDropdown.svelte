<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import {
    Button,
    Checkbox,
    Input,
    Spinner,
  } from '@logdash/hyper-ui/presentational';
  import { Feature } from '$lib/domains/shared/types.js';
  import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  type Props = {
    clusterId: string;
    onClose: () => void;
    inputId?: string;
  };

  const {
    clusterId,
    onClose,
    inputId = 'new-service-name-input',
  }: Props = $props();

  let isCreating = $state(false);
  let serviceName = $state('');
  let selectedFeatures = $state<Feature[]>([]);

  const canCreate = $derived(serviceName.trim().length > 0 && !isCreating);

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
    if (!canCreate) return;

    isCreating = true;
    try {
      const result = await ProjectsService.createProject(clusterId, {
        name: serviceName,
        selectedFeatures:
          selectedFeatures.length > 0 ? selectedFeatures : undefined,
      });

      onClose();
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
      onClose();
    }
  }

  function onBackdropClick(): void {
    onClose();
  }

  $effect(() => {
    setTimeout(() => {
      document.getElementById(inputId)?.focus();
    }, 50);
  });
</script>

<button
  class="fixed inset-0 z-40"
  onclick={onBackdropClick}
  aria-label="Close form"
></button>

<div
  class="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-3 rounded-xl ld-card-border ld-card-bg p-4 shadow-xl min-w-52"
  in:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
>
  <div class="flex items-center justify-between">
    <h3 class="font-medium text-sm">New service</h3>
    <Button variant="ghost" size="xs" shape="circle" onclick={onClose}>
      <CloseIcon class="size-4" />
    </Button>
  </div>

  <Input
    id={inputId}
    type="text"
    placeholder="Service name"
    size="sm"
    class="w-full"
    bind:value={serviceName}
    onkeydown={onKeyDown}
    maxlength={64}
  />

  <div class="flex flex-col gap-1">
    <span class="text-xs text-neutral-400">Features (optional)</span>
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
  </div>

  <div class="flex items-center gap-1.5">
    <Button
      variant="primary"
      size="sm"
      class="flex-1"
      onclick={onCreateService}
      disabled={!canCreate}
    >
      {#if isCreating}
        <Spinner size="xs" aria-hidden="true" />
        Creating...
      {:else}
        Create
      {/if}
    </Button>
    <Button variant="ghost" size="sm" onclick={onClose}>Cancel</Button>
  </div>
</div>
