<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { onMount } from 'svelte';
  import {
    wizardState,
    type ScrollTarget,
  } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import ProjectDetailsStep from './steps/ProjectDetailsStep.svelte';
  import ServicesStep from './steps/ServicesStep.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

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

  async function onSubmit(): Promise<void> {
    try {
      await wizardState.submit();
    } catch {
      toast.error('Failed to create project');
    }
  }
</script>

<div
  bind:this={containerRef}
  class="flex w-full flex-col gap-4 py-6 max-w-2xl mx-auto"
>
  <div class="flex items-center gap-2 w-full justify-between px-2">
    <div class="flex flex-col gap-1">
      <h1 class="text-lg md:text-xl font-medium text-fg-default">
        Create a new project
      </h1>
      <p class="text-sm text-neutral-300">
        You can always change the settings later.
      </p>
    </div>
    <Button
      variant="ghost"
      size="sm"
      shape="circle"
      class="text-neutral-500 hover:text-fg-default"
      onclick={() => goto(resolve('/app/clusters'))}
    >
      <CloseIcon class="size-6" />
    </Button>
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
        <Button
          variant="primary"
          onclick={onSubmit}
          disabled={!isValid || isSubmitting}
        >
          {#if isSubmitting}
            <Spinner size="sm" aria-hidden="true" />
            Creating...
          {:else}
            Create Project
          {/if}
        </Button>
      </div>
    {/if}
  </div>
</div>
