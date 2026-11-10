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
    d="M2.75 2.75l10.5 10.5M6.6 6.6a2 2 0 0 0 2.8 2.8M4.3 4.5C3 5.5 2.25 8 2.25 8s2 4 5.75 4c1 0 1.8-.25 2.5-.6M12.4 10.6C13.3 9.6 13.75 8 13.75 8s-2-4-5.75-4c-.35 0-.7.03-1 .1"
  />
</svg>
