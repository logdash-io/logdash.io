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
  <circle cx="8" cy="8" r="2.25" />
  <path d="M10.25 5.75v3a1.75 1.75 0 0 0 3.5 0V8a5.75 5.75 0 1 0-2.3 4.6" />
</svg>
