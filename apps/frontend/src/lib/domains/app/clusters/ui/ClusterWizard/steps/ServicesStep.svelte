<script lang="ts">
  import { onMount } from 'svelte';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import ServiceCard from '../ServiceCard.svelte';

  const services = $derived(wizardState.services);
  const canRemoveServices = $derived(services.length > 1);
  const lastService = $derived(services[services.length - 1]);
  const canAddService = $derived(
    lastService &&
      lastService.name.length >= 1 &&
      lastService.features.length > 0,
  );

  onMount(() => {
    const firstServiceId = services[0]?.id;

    if (firstServiceId) {
      focusService(firstServiceId);
    }
  });

  function onAddService(): void {
    focusService(wizardState.addService());
  }

  function onRemoveService(id: string): void {
    wizardState.removeService(id);
  }

  function onServiceNameChange(id: string, name: string): void {
    wizardState.updateServiceName(id, name);
  }

  function onToggleFeature(serviceId: string, feature: Feature): void {
    wizardState.toggleServiceFeature(serviceId, feature);
  }

  function focusService(id: string): void {
    setTimeout(() => {
      document.getElementById(`service-input-${id}`)?.focus();
    }, 50);
  }
</script>

{#each services as service (service.id)}
  <div id="wizard-service-{service.id}">
    <ServiceCard
      {service}
      canRemove={canRemoveServices}
      onNameChange={(name: string) => onServiceNameChange(service.id, name)}
      onRemove={() => onRemoveService(service.id)}
      onToggleFeature={(feature: Feature) =>
        onToggleFeature(service.id, feature)}
    />
  </div>
{/each}

{#if canAddService}
  <button
    type="button"
    class="text-neutral-500 hover:bg-surface-100 hover:text-fg-default focus-visible:outline-brand flex h-11 w-full cursor-pointer items-center gap-2 px-4 text-left text-sm focus-visible:-outline-offset-2 focus-visible:outline-2"
    onclick={onAddService}
  >
    <PlusIcon class="size-4 shrink-0 text-neutral-600" />
    Add another service
  </button>
{/if}
