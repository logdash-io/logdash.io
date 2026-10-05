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
  <circle cx="8" cy="8" r="5.25" />
  <path
    d="M2.75 8h10.5M8 2.75c1.5 1.4 2.25 3.15 2.25 5.25S9.5 11.85 8 13.25C6.5 11.85 5.75 10.1 5.75 8S6.5 4.15 8 2.75Z"
  />
</svg>
