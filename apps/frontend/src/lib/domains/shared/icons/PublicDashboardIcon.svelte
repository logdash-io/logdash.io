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
  <rect x="2.25" y="2.75" width="11.5" height="10.5" rx="2.75" />
  <path d="M4.75 8.25h1.5l1-1.75 1.5 3.5 1-1.75h1.5" />
</svg>
