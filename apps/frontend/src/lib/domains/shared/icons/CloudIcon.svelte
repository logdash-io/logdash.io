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
  <path
    d="M4.9 12.25a2.9 2.9 0 0 1-.35-5.78 3.75 3.75 0 0 1 7.25.32 2.75 2.75 0 0 1-.55 5.46Z"
  />
</svg>
