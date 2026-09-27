<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  const { class: className = '' }: { class?: ClassValue } = $props();
</script>

<svg
  class={className}
  viewBox="0 0 16 16"
  fill="none"
  aria-hidden="true"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M3 8H13"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    class="origin-center transition-transform duration-200 ease-out in-open:rotate-90 motion-reduce:transition-none"
    d="M8 3V13"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
</svg>
