<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';

  type Props = {
    dot: string;
    title: string;
    detail: string;
  };

  const { dot, title, detail }: Props = $props();
</script>

<div
  class="ring-hairline bg-surface-root absolute top-0 right-0 flex w-52 gap-2.5 rounded-lg px-3 py-2 ring-1"
  role="status"
  in:fly={{
    y: -6,
    duration: prefersReducedMotion.current ? 0 : 500,
    easing: quintOut,
  }}
  out:fade={{ duration: prefersReducedMotion.current ? 0 : 300 }}
>
  <span class={['mt-1.5 size-1.5 shrink-0 rounded-full', dot]}></span>
  <div class="flex min-w-0 flex-col gap-0.5">
    <span class="text-sm font-medium tabular-nums">{title}</span>
    <span class="text-neutral-500 text-xs tabular-nums">{detail}</span>
  </div>
</div>
