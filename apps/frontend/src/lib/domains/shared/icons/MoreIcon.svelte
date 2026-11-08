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
  <circle cx="3.5" cy="8" r="1.25" />
  <circle cx="8" cy="8" r="1.25" />
  <circle cx="12.5" cy="8" r="1.25" />
</svg>
