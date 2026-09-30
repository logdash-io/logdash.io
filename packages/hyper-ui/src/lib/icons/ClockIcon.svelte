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
  <circle cx="8" cy="8" r="5.75" />
  <path d="M8 5v3l2 1.25" />
</svg>
