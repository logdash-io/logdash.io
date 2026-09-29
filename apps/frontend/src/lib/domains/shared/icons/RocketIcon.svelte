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
  <path
    d="M2.25 8.75a5.75 5.75 0 0 1 5 5 4.25 4.25 0 0 0 2.25-3.5 6.5 6.5 0 0 0 4.25-5.75 2.25 2.25 0 0 0-2.25-2.25 6.5 6.5 0 0 0-5.75 4.25 4.25 4.25 0 0 0-3.5 2.25"
  />
  <path d="M4.5 9.5a4.25 4.25 0 0 0-2.25 4.25 4.25 4.25 0 0 0 4.25-2.25" />
  <circle cx="10.75" cy="5.25" r=".6" />
</svg>
