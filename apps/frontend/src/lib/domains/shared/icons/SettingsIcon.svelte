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
  <path d="M2.75 5h5M11.75 5h1.5M2.75 11h1.5M8.25 11h5" />
  <circle cx="9.75" cy="5" r="1.75" />
  <circle cx="6.25" cy="11" r="1.75" />
</svg>
