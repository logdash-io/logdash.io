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
  <circle cx="6" cy="5.75" r="2.5" />
  <path d="M1.75 13.25c.6-1.95 2.2-3 4.25-3s3.65 1.05 4.25 3" />
  <path
    d="M10.25 3.4a2.5 2.5 0 0 1 0 4.7M11.75 10.4c1.2.4 2.05 1.35 2.5 2.85"
  />
</svg>
