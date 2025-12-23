<script lang="ts">
  import { onMount } from 'svelte';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { fly } from 'svelte/transition';
  import ColorPalette from '../ColorPalette.svelte';

  let inputRef: HTMLInputElement;

  const step = $derived(wizardState.step);
  const project = $derived(wizardState.project);
  const canProceed = $derived(wizardState.canProceedToStep2);

  onMount(() => {
    inputRef?.focus();
  });

  function onNameChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    wizardState.setProjectName(target.value);
  }

  function onColorSelect(color: string): void {
    wizardState.setProjectColor(color);
  }

  function onNextStep(): void {
    wizardState.nextStep();
  }
</script>

<div class="flex flex-col gap-6">
  <input
    bind:this={inputRef}
    id="project-name"
    type="text"
    placeholder="Project Name"
    class="text-3xl md:text-5xl leading-normal font-medium w-full focus:border-primary border-b-2 border-transparent transition-colors duration-200 outline-0"
    value={project.name}
    oninput={onNameChange}
    minlength={3}
    maxlength={20}
  />

  <p class="text-sm text-base-content/80 grid overflow-hidden h-4.5">
    {#if canProceed}
      <span
        class="col-start-1 row-start-1"
        in:fly={{ y: -20, duration: 300 }}
        out:fly={{ y: 20, duration: 300 }}
      >
        and pick a color to distinguish easily
      </span>
    {:else}
      <span
        class="col-start-1 row-start-1"
        in:fly={{ y: -20, duration: 300 }}
        out:fly={{ y: 20, duration: 300 }}
      >
        e.g. Lemonify
      </span>
    {/if}
  </p>

  <ColorPalette
    selectedColor={project.color}
    disabled={!canProceed}
    onSelect={onColorSelect}
  />

  {#if step === 1}
    <div class="flex justify-end">
      <button
        class="btn btn-primary"
        onclick={onNextStep}
        disabled={!canProceed}
      >
        Next step
      </button>
    </div>
  {/if}
</div>
