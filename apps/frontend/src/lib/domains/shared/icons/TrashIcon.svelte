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
  <path d="M2.75 4.25h10.5" />
  <path
    d="M6 4.25V3.5a1.25 1.25 0 0 1 1.25-1.25h1.5A1.25 1.25 0 0 1 10 3.5v.75"
  />
  <path
    d="M4.25 4.25V12A1.75 1.75 0 0 0 6 13.75h4A1.75 1.75 0 0 0 11.75 12V4.25"
  />
</svg>
