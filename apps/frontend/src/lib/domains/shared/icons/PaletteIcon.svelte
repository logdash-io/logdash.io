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
    d="M8 13.75a5.75 5.75 0 1 1 5.75-5.75c0 1.4-1.1 2.25-2.5 2.25h-1.5a1.25 1.25 0 0 0-.9 2.1c.6.65.15 1.4-.85 1.4Z"
  />
  <circle cx="5.25" cy="8.25" r=".5" />
  <circle cx="6.5" cy="5.25" r=".5" />
  <circle cx="9.75" cy="5" r=".5" />
</svg>
