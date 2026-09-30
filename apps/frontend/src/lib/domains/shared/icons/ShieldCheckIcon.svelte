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
    d="M8 13.75s4.75-2 4.75-5.75V4.25L8 2.25 3.25 4.25V8c0 3.75 4.75 5.75 4.75 5.75Z"
  />
  <path d="m5.75 7.75 1.5 1.5 3-3" />
</svg>
