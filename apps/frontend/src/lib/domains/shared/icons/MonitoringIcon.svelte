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
  <path d="M1.75 8.25h2.5l1.5-3.75 3.5 7.5 1.5-3.75h3.5" />
</svg>
