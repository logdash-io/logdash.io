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
  <circle cx="8" cy="5.5" r="2.75" />
  <path d="M3.25 13.5c.75-2.1 2.55-3.25 4.75-3.25s4 1.15 4.75 3.25" />
</svg>
