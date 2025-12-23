<script lang="ts">
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { Feature } from '$lib/domains/shared/types.js';
  import ServiceCard from '../ServiceCard.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  const services = $derived(wizardState.services);
  const canRemoveServices = $derived(services.length > 1);
  const lastService = $derived(services[services.length - 1]);
  const canAddService = $derived(
    lastService &&
      lastService.name.length >= 1 &&
      lastService.features.length > 0,
  );

  let expandedServiceId = $state<string | null>(null);

  const activeExpandedId = $derived(
    expandedServiceId ?? services[services.length - 1]?.id ?? null,
  );

  function onAddService(): void {
    const id = wizardState.addService();
    expandedServiceId = id;
    setTimeout(() => {
      const input = document.getElementById(`service-input-${id}`);
      input?.focus();
    }, 50);
  }

  function onRemoveService(id: string): void {
    wizardState.removeService(id);
    if (expandedServiceId === id) {
      expandedServiceId = null;
    }
  }

  function onServiceNameChange(id: string, name: string): void {
    wizardState.updateServiceName(id, name);
  }

  function onToggleFeature(serviceId: string, feature: Feature): void {
    wizardState.toggleServiceFeature(serviceId, feature);
  }
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col px-2">
    <h2 class="text-lg md:text-xl leading-normal font-medium">Add services</h2>
    <p class="text-sm text-base-content/80">
      Services are your project building blocks, like a backend, queue worker,
      or BFF.
    </p>
  </div>

  {#each services as service, index (service.id)}
    <div
      class=""
      id="wizard-service-{service.id}"
      in:fly={{ y: -10, duration: 200, easing: cubicOut }}
    >
      <ServiceCard
        {service}
        {index}
        expanded={activeExpandedId === service.id}
        canRemove={canRemoveServices}
        onNameChange={(name) => onServiceNameChange(service.id, name)}
        onRemove={() => onRemoveService(service.id)}
        onToggleFeature={(feature) => onToggleFeature(service.id, feature)}
      />
    </div>
  {/each}

  {#if canAddService}
    <button
      class="divider w-full gap-1 cursor-pointer divider-base-100 hover:divider-primary/20 hover:text-primary"
      onclick={onAddService}
      in:fly={{ y: -5, duration: 200, easing: cubicOut }}
    >
      <PlusIcon class="size-4 -mr-2 shrink-0" />
      Add another service
    </button>
  {/if}
</div>
