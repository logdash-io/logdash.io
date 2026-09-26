<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };

  const { class: className = '' }: Props = $props();
</script>

<svg
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M4 12.75L9.05 17.8L20 6.85"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
