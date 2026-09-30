<script lang="ts">
  import type { WizardService } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { SETTINGS_INPUT_CLASS } from '$lib/domains/shared/ui/components/settings-card';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Checkbox, Input } from '@logdash/hyper-ui/presentational';

  type Props = {
    service: WizardService;
    canRemove: boolean;
    onNameChange: (name: string) => void;
    onRemove: () => void;
    onToggleFeature: (feature: Feature) => void;
  };
  const { service, canRemove, onNameChange, onRemove, onToggleFeature }: Props =
    $props();

  const FEATURES = [
    {
      feature: Feature.LOGGING,
      label: 'Logs',
      description: 'Unified logs with advanced filtering',
      icon: LogsIcon,
    },
    {
      feature: Feature.METRICS,
      label: 'Metrics',
      description: 'Health metrics, like roundtrip latency',
      icon: MetricsIcon,
    },
    {
      feature: Feature.MONITORING,
      label: 'Monitoring',
      description: 'Status pages, health checks and alerts',
      icon: MonitoringIcon,
    },
  ];

  function onInputChange(e: Event): void {
    onNameChange((e.target as HTMLInputElement).value);
  }
</script>

<div class="flex flex-col gap-3 p-4 text-sm">
  <div class="flex min-w-0 items-center gap-3">
    <label
      for="service-input-{service.id}"
      class="text-neutral-500 w-16 shrink-0"
    >
      Name
    </label>
    <Input
      id="service-input-{service.id}"
      size="sm"
      class={['w-full max-w-64', SETTINGS_INPUT_CLASS]}
      placeholder="backend"
      value={service.name}
      oninput={onInputChange}
      maxlength={64}
    />

    {#if canRemove}
      <IconButton
        label="Remove service"
        danger
        class="-mr-1.5 ml-auto"
        onclick={onRemove}
      >
        <TrashIcon class="size-4" />
      </IconButton>
    {/if}
  </div>

  <div class="flex flex-col gap-1 sm:pl-19">
    {#each FEATURES as { feature, label, description, icon: Icon } (feature)}
      <label class="flex min-w-0 cursor-pointer items-center gap-3 py-1">
        <Checkbox
          size="xs"
          variant="primary"
          checked={service.features.includes(feature)}
          onchange={() => onToggleFeature(feature)}
        />
        <Icon class="size-4 shrink-0 text-neutral-500" />
        <span class="shrink-0">{label}</span>
        <span class="text-neutral-500 min-w-0 truncate max-sm:hidden">
          {description}
        </span>
      </label>
    {/each}
  </div>
</div>
