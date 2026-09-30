<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };

  const { class: className = '' }: Props = $props();
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
  <path d="M9.25 2.75h2a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-2" />
  <path d="M9.25 8h-6.5M5.75 5l-3 3 3 3" />
</svg>
