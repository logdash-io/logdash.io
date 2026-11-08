<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  const { class: className = '' }: { class?: ClassValue } = $props();
</script>

<svg
  class={className}
  viewBox="0 0 16 16"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <rect x="2" y="2.5" width="12" height="3" rx="1" />
  <rect x="2" y="6.5" width="8" height="3" rx="1" />
  <rect x="2" y="10.5" width="4.5" height="3" rx="1" />
</svg>
