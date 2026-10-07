<script lang="ts">
  import { PROJECT_COLORS } from '$lib/domains/app/clusters/domain/project-colors';

  type Props = {
    selectedColor: string;
    onSelect: (color: string) => void;
  };
  const { selectedColor, onSelect }: Props = $props();

  const isCustomColor = $derived(
    selectedColor && !PROJECT_COLORS.includes(selectedColor),
  );

  function onCustomColorChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    onSelect(target.value);
  }
</script>

<div class="flex flex-wrap items-center gap-3">
  {#each PROJECT_COLORS as color (color)}
    {@const isSelected = selectedColor === color}
    <button
      type="button"
      aria-label="Color {color}"
      aria-pressed={isSelected}
      class={[
        'flex size-3.5 cursor-pointer items-center justify-center rounded-xl transition-[scale] duration-200',
        isSelected
          ? 'outline-brand outline-2 outline-offset-2'
          : 'hover:scale-110',
      ]}
      style:background-color={color}
      onclick={() => onSelect(color)}
    ></button>
  {/each}

  <label
    class={[
      'relative flex size-3.5 cursor-pointer items-center justify-center rounded-xl transition-[scale] duration-200 hover:scale-110',
      {
        'outline-brand outline-2 outline-offset-2': isCustomColor,
      },
    ]}
    style={isCustomColor
      ? `background-color: ${selectedColor}`
      : 'background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'}
  >
    <input
      type="color"
      aria-label="Custom color"
      value={selectedColor || '#000000'}
      oninput={onCustomColorChange}
      class="absolute inset-0 cursor-pointer opacity-0"
    />
  </label>
</div>
