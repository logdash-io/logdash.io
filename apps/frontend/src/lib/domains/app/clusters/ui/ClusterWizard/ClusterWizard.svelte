<script lang="ts">
  import { onMount } from 'svelte';
  import {
    wizardState,
    type ScrollTarget,
  } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import ProjectDetailsStep from './steps/ProjectDetailsStep.svelte';
  import ServicesStep from './steps/ServicesStep.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import CloseIcon from '$lib/domains/shared/icons/CloseIcon.svelte';
  import { goto } from '$app/navigation';

  let containerRef: HTMLDivElement;

  const step = $derived(wizardState.step);
  const isValid = $derived(wizardState.isValid);
  const isSubmitting = $derived(wizardState.isSubmitting);

  function scrollToElement(target: ScrollTarget): void {
    const elementId = `wizard-${target}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onMount(() => {
    wizardState.setScrollHandler(scrollToElement);
  });

  function onSubmit(): void {
    wizardState.submit();
  }
</script>

<div
  bind:this={containerRef}
  class="flex w-full flex-col gap-4 py-6 max-w-2xl mx-auto"
>
  <div class="flex items-center gap-2 w-full justify-between px-2">
    <div class="flex flex-col gap-1">
      <h1 class="text-lg md:text-xl font-medium text-base-content">
        Create a new project
      </h1>
      <p class="text-sm text-base-content/80">
        You can always change the settings later.
      </p>
    </div>
    <button
      onclick={() => goto('/app/clusters')}
      class="btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-base-content"
    >
      <CloseIcon class="size-6" />
    </button>
  </div>

  <div class="flex flex-col gap-6">
    <div
      id="wizard-project"
      class={[
        'transition-opacity duration-300 px-2',
        { 'opacity-20 pointer-events-none': step > 1 },
      ]}
      in:fly={{ y: 5, duration: 250, easing: cubicOut }}
    >
      <ProjectDetailsStep />
    </div>

    {#if step >= 2}
      <div
        id="wizard-services"
        in:fly={{ y: 5, duration: 250, easing: cubicOut }}
      >
        <ServicesStep />
      </div>

      <div
        class="flex justify-end"
        in:fly={{ y: 5, duration: 250, delay: 100, easing: cubicOut }}
      >
        <button
          class="btn btn-primary"
          onclick={onSubmit}
          disabled={!isValid || isSubmitting}
        >
          {#if isSubmitting}
            <span class="loading loading-spinner loading-sm"></span>
            Creating...
          {:else}
            Create Project
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>
