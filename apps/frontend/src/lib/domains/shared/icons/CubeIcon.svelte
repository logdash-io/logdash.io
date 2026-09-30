<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  const {
    class: className = '',
    style = '',
  }: { class?: ClassValue; style?: string } = $props();
</script>

<svg
  class={className}
  {style}
  viewBox="0 0 16 16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M7.13 1.99a1.75 1.75 0 0 1 1.74 0l3.88 2.24c.54.31.87.89.87 1.51v4.52c0 .62-.33 1.2-.87 1.51l-3.88 2.24a1.75 1.75 0 0 1-1.74 0l-3.88-2.24a1.75 1.75 0 0 1-.87-1.51V5.74c0-.62.33-1.2.87-1.51Z"
  />
  <path d="M2.75 4.85 8 7.9l5.25-3.05M8 7.9v6.2" />
</svg>
