<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  const { class: className = "" }: { class?: ClassValue } = $props();
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
    d="M6.92 2.87a1.25 1.25 0 0 1 2.16 0l4.83 8.38a1.25 1.25 0 0 1-1.08 1.87H3.17a1.25 1.25 0 0 1-1.08-1.87Z"
  />
  <path d="M8 6.5v2.25" />
  <path d="M8 10.9v.1" />
</svg>
