<script lang="ts">
  import { untrack } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { prefersReducedMotion } from 'svelte/motion';

  type Props = {
    text: string;
    class?: ClassValue;
  };

  const DELETE_CHAR_MS = 20;
  const DELETE_MAX_MS = 240;
  const BEAT_MS = 80;
  const TYPE_CHAR_MS = 35;
  const TYPE_MAX_MS = 450;

  const { text, class: className }: Props = $props();

  let shown = $state(untrack(() => text));
  let typing = $state(false);

  $effect(() => {
    const to = text;
    const from = untrack(() => shown);

    if (from === to || !from || prefersReducedMotion.current) {
      shown = to;
      typing = false;
      return;
    }

    const deleteMs = Math.min(from.length * DELETE_CHAR_MS, DELETE_MAX_MS);
    const typeAt = deleteMs + BEAT_MS;
    const typeMs = Math.min(to.length * TYPE_CHAR_MS, TYPE_MAX_MS);
    const start = performance.now();
    let frame = requestAnimationFrame(step);

    typing = true;

    function step(now: number): void {
      const elapsed = now - start;

      if (elapsed >= typeAt + typeMs) {
        shown = to;
        typing = false;
        return;
      }

      shown =
        elapsed < deleteMs
          ? from.slice(0, Math.ceil(from.length * (1 - elapsed / deleteMs)))
          : to.slice(
              0,
              Math.floor((to.length * Math.max(0, elapsed - typeAt)) / typeMs),
            );
      frame = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(frame);
  });
</script>

<span class={['truncate', className]}>
  <span class="sr-only">{text}</span>
  <span aria-hidden="true">
    {shown}{#if typing}<span
        class="ml-px inline-block h-[1.1em] w-px bg-current align-[-0.2em]"
      ></span>{/if}
  </span>
</span>
