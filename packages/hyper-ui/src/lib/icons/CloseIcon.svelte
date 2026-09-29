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
  <path d="m4.25 4.25 7.5 7.5M11.75 4.25l-7.5 7.5" />
</svg>
