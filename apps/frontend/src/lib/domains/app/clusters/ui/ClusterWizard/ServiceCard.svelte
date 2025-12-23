<script lang="ts">
  import type { WizardService } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  type Props = {
    service: WizardService;
    index: number;
    expanded: boolean;
    canRemove: boolean;
    onNameChange: (name: string) => void;
    onRemove: () => void;
    onToggleFeature: (feature: Feature) => void;
  };
  const {
    service,
    index,
    expanded,
    canRemove,
    onNameChange,
    onRemove,
    onToggleFeature,
  }: Props = $props();

  const hasName = $derived(service.name.length >= 1);

  const featureConfig = [
    {
      feature: Feature.LOGGING,
      label: 'Logging',
      description: 'Unified logs with advanced filtering.',
      icon: LogsIcon,
    },
    {
      feature: Feature.METRICS,
      label: 'Metrics',
      description: 'Critical health metrics, like roundtrip latency.',
      icon: MetricsIcon,
    },
    {
      feature: Feature.MONITORING,
      label: 'Monitoring',
      description: 'Status pages, health checks, and alerts.',
      icon: MonitoringIcon,
    },
  ];

  function onInputChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    onNameChange(target.value);
  }

  function isFeatureEnabled(feature: Feature): boolean {
    return service.features.includes(feature);
  }

  const enabledFeatures = $derived(
    featureConfig.filter((f) => service.features.includes(f.feature)),
  );
</script>

{#if expanded}
  <div class="flex flex-col gap-3 px-2">
    <div class="flex items-center gap-3">
      <input
        id="service-input-{service.id}"
        type="text"
        placeholder="Service name"
        class="text-4xl leading-normal font-medium w-full focus:border-primary border-b-2 border-transparent transition-colors duration-200 outline-0"
        value={service.name}
        oninput={onInputChange}
        maxlength={64}
      />

      {#if canRemove}
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square text-base-content/30 hover:text-error"
          onclick={onRemove}
        >
          <TrashIcon class="size-4" />
        </button>
      {/if}
    </div>

    <p class="text-sm text-base-content/80 grid overflow-hidden h-4.5">
      {#if hasName}
        <span
          class="col-start-1 row-start-1"
          in:fly={{ y: -20, duration: 300 }}
          out:fly={{ y: 20, duration: 300 }}
        >
          and pick features you'll need
        </span>
      {:else}
        <span
          class="col-start-1 row-start-1"
          in:fly={{ y: -20, duration: 300 }}
          out:fly={{ y: 20, duration: 300 }}
        >
          e.g. backend
        </span>
      {/if}
    </p>

    <div
      class={[
        'flex flex-col divide-y divide-base-200 transition-opacity duration-300 ld-card-rounding overflow-hidden ld-card-border',
        {
          'opacity-30 pointer-events-none': !hasName,
        },
      ]}
      in:fly={{ y: -5, duration: 200, easing: cubicOut }}
    >
      {#each featureConfig as { feature, label, description, icon: Icon }}
        <label
          class={[
            'flex items-center gap-3 p-4 px-4.5 cursor-pointer transition-colors duration-200 hover:bg-base-100/60',
            { 'text-primary': isFeatureEnabled(feature) },
            { '': !isFeatureEnabled(feature) },
          ]}
        >
          <Icon class="size-6 shrink-0" />

          <div class="flex flex-col flex-1 select-none">
            <span class="font-medium text-sm">{label}</span>
            <span class="text-xs text-base-content/60">{description}</span>
          </div>

          <input
            type="checkbox"
            class="checkbox checkbox-primary checkbox-sm"
            checked={isFeatureEnabled(feature)}
            onchange={() => onToggleFeature(feature)}
          />
        </label>
      {/each}
    </div>
  </div>
{:else}
  <div
    class="flex items-center gap-4 p-4 px-5 w-full ld-card-bg ld-card-border ld-card-rounding opacity-40"
  >
    <div class="flex flex-col flex-1 gap-1">
      <span class="font-medium text-lg">{service.name}</span>
      <div class="flex items-center gap-3">
        {#each enabledFeatures as { label, icon: Icon }}
          <div class="flex items-center gap-1.5 text-xs text-base-content/60">
            <Icon class="size-3.5" />
            <span>{label}</span>
          </div>
        {/each}
      </div>
    </div>

    {#if canRemove}
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square text-base-content/30 hover:text-error"
        onclick={onRemove}
      >
        <TrashIcon class="size-4" />
      </button>
    {/if}
  </div>
{/if}
