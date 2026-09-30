<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  const { class: className = '' }: { class?: ClassValue } = $props();
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
    d="M7.25 2.75H5A2.25 2.25 0 0 0 2.75 5v6A2.25 2.25 0 0 0 5 13.25h6A2.25 2.25 0 0 0 13.25 11V8.75"
  />
  <path d="M11.9 2.6a1.2 1.2 0 0 1 1.7 1.7L8.5 9.4l-2.25.5.5-2.25Z" />
</svg>
