<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  import LogoMark from './LogoMark.svelte';

  type Props = {
    class?: ClassValue;
  };

  const { class: className = '' }: Props = $props();
</script>

<span
  class={['inline-flex items-center gap-2 leading-none', className]}
  role="img"
  aria-label="Logdash"
>
  <LogoMark class="size-[1.4em] shrink-0" />

  <span class="font-semibold tracking-[-0.03em]">logdash</span>
</span>
