<script lang="ts">
  import { PROJECT_COLORS } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';

  type Props = {
    selectedColor: string;
    disabled?: boolean;
    onSelect: (color: string) => void;
  };
  const { selectedColor, disabled = false, onSelect }: Props = $props();

  const isCustomColor = $derived(
    selectedColor && !PROJECT_COLORS.includes(selectedColor),
  );

  function onCustomColorChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    onSelect(target.value);
  }
</script>

<div
  class={[
    'flex flex-wrap items-center gap-3 transition-all duration-200',
    { 'opacity-20 pointer-events-none': disabled },
  ]}
>
  {#each PROJECT_COLORS as color}
    {@const isSelected = selectedColor === color}
    <button
      type="button"
      class={[
        'flex size-3.5 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer',
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

  <label
    class={[
      'relative flex size-3.5 cursor-pointer items-center justify-center rounded-xl transition-all duration-200',
      {
        'ring-2 ring-offset-2 ring-offset-base-300': isCustomColor && !disabled,
        'hover:scale-110': !disabled,
      },
    ]}
    style={isCustomColor
      ? `background-color: ${selectedColor}; ring-color: ${selectedColor}`
      : 'background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'}
  >
    <input
      type="color"
      value={selectedColor || '#000000'}
      oninput={onCustomColorChange}
      class="absolute inset-0 cursor-pointer opacity-0"
      {disabled}
    />
  </label>
</div>
