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
  <rect x="2" y="2.5" width="3" height="11" rx="1" />
  <rect x="6.5" y="6" width="3" height="7.5" rx="1" />
  <rect x="11" y="9.5" width="3" height="4" rx="1" />
</svg>
