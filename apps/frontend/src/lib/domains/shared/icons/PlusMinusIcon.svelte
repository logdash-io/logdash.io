<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  const { class: className = '' }: { class?: ClassValue } = $props();
</script>

<svg
  class={className}
  viewBox="0 0 16 16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path d="M3.25 8h9.5" />
  <path
    class="origin-center transition-transform duration-200 ease-out in-open:rotate-90 motion-reduce:transition-none"
    d="M8 3.25v9.5"
  />
</svg>
