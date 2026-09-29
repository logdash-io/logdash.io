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
  <rect x="2.75" y="2.75" width="4.25" height="4.25" rx="1.25" />
  <rect x="9" y="2.75" width="4.25" height="4.25" rx="1.25" />
  <rect x="2.75" y="9" width="4.25" height="4.25" rx="1.25" />
  <rect x="9" y="9" width="4.25" height="4.25" rx="1.25" />
</svg>
