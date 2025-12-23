<script lang="ts">
  import { PROJECT_COLORS } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';

  type Props = {
    selectedColor: string;
    disabled?: boolean;
    onSelect: (color: string) => void;
  };
  const { selectedColor, disabled = false, onSelect }: Props = $props();
</script>

<div
  class={[
    'flex flex-wrap gap-3 transition-all duration-200',
    { 'opacity-20 pointer-events-none': disabled },
  ]}
>
  {#each PROJECT_COLORS as color}
    {@const isSelected = selectedColor === color}
    <button
      type="button"
      class={[
        'flex size-5 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer',
        {
          'ring-2 ring-offset-2 ring-offset-base-300': isSelected && !disabled,
          'hover:scale-110': !isSelected && !disabled,
        },
      ]}
      style="background-color: {color}; {isSelected && !disabled
        ? `ring-color: ${color}`
        : ''}"
      onclick={() => onSelect(color)}
      {disabled}
    ></button>
  {/each}
</div>
