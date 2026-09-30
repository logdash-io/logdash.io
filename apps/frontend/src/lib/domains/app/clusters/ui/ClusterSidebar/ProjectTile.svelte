<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    name: string;
    color?: string;
    class?: ClassValue;
  };

  const {
    name,
    color,
    class: className = 'size-4 rounded-[5px] text-[10px]',
  }: Props = $props();

  const tint = $derived(
    color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
  );
</script>

<span
  class={[
    'flex shrink-0 items-center justify-center font-semibold uppercase',
    { 'bg-surface-150 text-neutral-300': !tint },
    className,
  ]}
  style={tint
    ? `background-color: color-mix(in oklab, ${tint} 26%, transparent); color: color-mix(in oklab, ${tint} 60%, white)`
    : undefined}
  aria-hidden="true"
>
  {name.trim().charAt(0) || '?'}
</span>
