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
  <path d="M6.25 11.75h3.5M6.75 14h2.5" />
  <path
    d="M6.25 11.75c0-.9-.3-1.5-.95-2.1A4.25 4.25 0 1 1 11.7 9.65c-.65.6-.95 1.2-.95 2.1"
  />
</svg>
