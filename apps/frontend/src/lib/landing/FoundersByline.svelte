<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };

  const { class: className }: Props = $props();
</script>

<div class={['flex items-center gap-3', className]}>
  <img
    class="ring-surface-root-bg size-9 rounded-full object-cover grayscale ring-2"
    src="/images/founders/simon.webp"
    alt="Simon Gracki"
    loading="lazy"
  />

  <div class="flex flex-col text-left">
    <span class="text-sm font-medium">Simon Gracki</span>
    <span class="text-fg-muted text-sm">Co-founder</span>
  </div>
</div>
