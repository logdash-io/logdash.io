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
  <path d="M6.5 9.5 9.5 6.5" />
  <path
    d="m8.75 4.25.9-.9a2.47 2.47 0 0 1 3.5 3.5l-.9.9M7.25 11.75l-.9.9a2.47 2.47 0 0 1-3.5-3.5l.9-.9"
  />
</svg>
