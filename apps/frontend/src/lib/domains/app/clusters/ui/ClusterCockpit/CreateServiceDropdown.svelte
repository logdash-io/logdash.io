<script lang="ts">
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { Feature } from '$lib/domains/shared/types.js';
  import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
  import { goto } from '$app/navigation';
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
  class="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-3 rounded-2xl ld-card-border ld-card-bg p-4 shadow-xl min-w-52"
  in:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
>
  <div class="flex items-center justify-between">
    <h3 class="font-semibold text-sm">New service</h3>
    <button class="btn btn-ghost btn-xs btn-circle" onclick={onClose}>
      <CloseIcon class="size-4" />
    </button>
  </div>

  <input
    id={inputId}
    type="text"
    placeholder="Service name"
    class="input input-sm input-bordered w-full"
    bind:value={serviceName}
    onkeydown={onKeyDown}
    maxlength={64}
  />

  <div class="flex flex-col gap-1">
    <span class="text-xs text-base-content/60">Features (optional)</span>
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
  </div>

  <div class="flex items-center gap-1.5">
    <button
      class="btn btn-primary btn-sm flex-1"
      onclick={onCreateService}
      disabled={!canCreate}
    >
      {#if isCreating}
        <span class="loading loading-spinner loading-xs"></span>
        Creating...
      {:else}
        Create
      {/if}
    </button>
    <button class="btn btn-ghost btn-sm" onclick={onClose}>Cancel</button>
  </div>
</div>
