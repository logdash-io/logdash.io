<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
    stroke?: ClassValue;
  };

  const { class: className = '', stroke: strokeClassName = '' }: Props =
    $props();
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
  <circle class={strokeClassName} cx="8" cy="8" r="5.75" />
  <path class={strokeClassName} d="M6.75 6.25v3.5M9.25 6.25v3.5" />
</svg>
